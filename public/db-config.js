/**
 * Configuration de base de données pour le système d'évaluation des enseignants
 * Gestion hybride localStorage + MongoDB avec synchronisation automatique
 */

class DatabaseManager {
    constructor() {
        this.API_BASE = '/api';
        this.isOnline = navigator.onLine;
        this.syncPending = false;
        this.syncQueue = [];
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;
        
        // Surveillance de la connectivité
        this.initConnectivityMonitoring();
        
        // Initialisation de la base de données
        this.initDatabase();
    }

    initConnectivityMonitoring() {
        window.addEventListener('online', () => {
            console.log('🌐 Connexion rétablie - Synchronisation en cours...');
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Mode hors ligne activé');
            this.isOnline = false;
        });
    }

    async initDatabase() {
        try {
            // Test de connectivité à l'API
            if (this.isOnline) {
                const response = await fetch(`${this.API_BASE}/health`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    const health = await response.json();
                    console.log('✅ API MongoDB opérationnelle:', health.message);
                    return true;
                }
            }
        } catch (error) {
            console.warn('⚠️ API indisponible, mode localStorage uniquement:', error.message);
            this.isOnline = false;
        }
        
        return false;
    }

    async saveEvaluation(evaluation) {
        const timestamp = new Date().toISOString();
        const evalWithTimestamp = {
            ...evaluation,
            localSaveTime: timestamp
        };

        // Sauvegarder localement immédiatement
        const localData = JSON.parse(localStorage.getItem('evaluationsDatabase') || '[]');
        localData.push(evalWithTimestamp);
        localStorage.setItem('evaluationsDatabase', JSON.stringify(localData));

        // Tenter la sauvegarde MongoDB si en ligne
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.API_BASE}/evaluations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(evalWithTimestamp)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('💾 Évaluation sauvegardée en MongoDB:', result.message);
                    return { success: true, source: 'mongodb', data: result };
                } else {
                    throw new Error(`Erreur API: ${response.status}`);
                }
            } catch (error) {
                console.warn('⚠️ Erreur MongoDB, ajout à la queue de sync:', error.message);
                this.addToSyncQueue('create', evalWithTimestamp);
                return { success: true, source: 'localStorage', queued: true };
            }
        } else {
            this.addToSyncQueue('create', evalWithTimestamp);
            return { success: true, source: 'localStorage', offline: true };
        }
    }

    async loadEvaluations(teacherName = null) {
        if (this.isOnline) {
            try {
                const url = teacherName 
                    ? `${this.API_BASE}/evaluations?teacherName=${encodeURIComponent(teacherName)}`
                    : `${this.API_BASE}/evaluations`;
                
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // Mettre à jour le cache local
                        if (!teacherName) {
                            localStorage.setItem('evaluationsDatabase', JSON.stringify(result.data));
                            this.lastSyncTime = new Date().toISOString();
                            localStorage.setItem('lastSyncTime', this.lastSyncTime);
                        }
                        console.log('📥 Données chargées depuis MongoDB:', result.data.length, 'évaluations');
                        return result.data;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Erreur lors du chargement MongoDB, fallback localStorage:', error.message);
            }
        }

        // Fallback vers localStorage
        const localData = JSON.parse(localStorage.getItem('evaluationsDatabase') || '[]');
        const filteredData = teacherName 
            ? localData.filter(eval => eval.teacherName === teacherName)
            : localData;
        
        console.log('💽 Données chargées depuis localStorage:', filteredData.length, 'évaluations');
        return filteredData;
    }

    async deleteEvaluation(evaluationId) {
        // Supprimer localement
        const localData = JSON.parse(localStorage.getItem('evaluationsDatabase') || '[]');
        const updatedData = localData.filter(eval => eval.id !== evaluationId);
        localStorage.setItem('evaluationsDatabase', JSON.stringify(updatedData));

        // Tenter la suppression MongoDB si en ligne
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.API_BASE}/evaluations/${evaluationId}`, {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('🗑️ Évaluation supprimée de MongoDB:', result.message);
                    return { success: true, source: 'mongodb' };
                } else {
                    throw new Error(`Erreur API: ${response.status}`);
                }
            } catch (error) {
                console.warn('⚠️ Erreur suppression MongoDB, ajout à la queue:', error.message);
                this.addToSyncQueue('delete', { id: evaluationId });
                return { success: true, source: 'localStorage', queued: true };
            }
        } else {
            this.addToSyncQueue('delete', { id: evaluationId });
            return { success: true, source: 'localStorage', offline: true };
        }
    }

    addToSyncQueue(operation, data) {
        this.syncQueue.push({
            operation,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Sauvegarder la queue
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        console.log('📋 Opération ajoutée à la queue de synchronisation:', operation, data.id || 'nouvelle');
    }

    async processSyncQueue() {
        if (this.syncPending || !this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        this.syncPending = true;
        console.log('🔄 Traitement de la queue de synchronisation:', this.syncQueue.length, 'opérations');

        try {
            const processed = [];
            
            for (const item of this.syncQueue) {
                try {
                    switch (item.operation) {
                        case 'create':
                            await fetch(`${this.API_BASE}/evaluations`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item.data)
                            });
                            break;
                            
                        case 'delete':
                            await fetch(`${this.API_BASE}/evaluations/${item.data.id}`, {
                                method: 'DELETE'
                            });
                            break;
                    }
                    
                    processed.push(item);
                    console.log('✅ Synchronisé:', item.operation, item.data.id || 'nouvelle évaluation');
                } catch (error) {
                    console.warn('❌ Erreur de synchronisation pour:', item.operation, error.message);
                    // Laisser l'item dans la queue pour un nouveau tentative
                }
            }

            // Retirer les items traités avec succès
            this.syncQueue = this.syncQueue.filter(item => !processed.includes(item));
            localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
            
            if (processed.length > 0) {
                console.log(`✅ Synchronisation terminée: ${processed.length} opérations traitées`);
                
                // Synchronisation complète des données
                await this.fullSync();
            }

        } catch (error) {
            console.error('❌ Erreur lors du traitement de la queue:', error);
        } finally {
            this.syncPending = false;
        }
    }

    async fullSync() {
        try {
            const localData = JSON.parse(localStorage.getItem('evaluationsDatabase') || '[]');
            
            const response = await fetch(`${this.API_BASE}/sync-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluations: localData })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('🔄 Synchronisation complète:', result.message);
                
                // Recharger les données depuis MongoDB
                const freshData = await this.loadEvaluations();
                return freshData;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation complète:', error);
        }
    }

    // Initialiser la queue depuis localStorage
    loadSyncQueue() {
        const saved = localStorage.getItem('syncQueue');
        if (saved) {
            this.syncQueue = JSON.parse(saved);
            console.log('📋 Queue de synchronisation chargée:', this.syncQueue.length, 'opérations en attente');
        }
    }

    // Statistiques de synchronisation
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            syncPending: this.syncPending,
            queueLength: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime
        };
    }
}

// Instance globale du gestionnaire de base de données
window.dbManager = new DatabaseManager();

// Charger la queue au démarrage
window.dbManager.loadSyncQueue();

// Traiter la queue si on est en ligne
if (navigator.onLine) {
    window.dbManager.processSyncQueue();
}