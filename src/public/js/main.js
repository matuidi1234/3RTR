document.addEventListener('DOMContentLoaded', function() {
    // Gestion des messages flash
    const flashMessages = document.querySelectorAll('.alert');
    flashMessages.forEach(msg => {
        setTimeout(() => {
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 500);
        }, 5000);
    });

    // Confirmation avant suppression
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet incident ?')) {
                e.preventDefault();
            }
        });
    });

    // Filtres dynamiques avec AJAX
    const filterForm = document.querySelector('.filters form');
    if (filterForm) {
        filterForm.addEventListener('change', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const params = new URLSearchParams(formData);
            
            fetch(`/api/incidents?${params}`)
                .then(response => response.json())
                .then(data => {
                    updateIncidentsList(data);
                })
                .catch(error => {
                    console.error('Erreur lors du filtrage:', error);
                    showNotification('Erreur lors du filtrage des incidents', 'error');
                });
        });
    }

    // Soumission du formulaire d'ajout d'incident avec AJAX
    const incidentForm = document.getElementById('incident-form');
    if (incidentForm) {
        incidentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            fetch('/api/incidents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.errors) {
                    displayFormErrors(data.errors);
                } else {
                    showNotification('Incident créé avec succès!', 'success');
                    this.reset();
                    // Rediriger vers la page d'accueil ou actualiser la liste
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la création de l\'incident', 'error');
            });
        });
    }

    // Affichage dynamique des champs selon le type d'incident
    const incidentTypeSelect = document.getElementById('type');
    if (incidentTypeSelect) {
        incidentTypeSelect.addEventListener('change', function() {
            const urgencyField = document.getElementById('urgency-field');
            const urgencySelect = document.getElementById('urgency');
            
            if (this.value === 'Blessure') {
                urgencyField.style.display = 'block';
                urgencySelect.value = 'haute';
                urgencySelect.disabled = true;
            } else if (this.value === 'Evasion') {
                urgencyField.style.display = 'block';
                urgencySelect.value = 'haute';
                urgencySelect.disabled = true;
            } else {
                urgencyField.style.display = 'block';
                urgencySelect.disabled = false;
            }
        });
    }

    // Gestion des boutons d'escalade d'urgence
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-escalate')) {
            e.preventDefault();
            const incidentId = e.target.dataset.id;
            
            fetch(`/api/incidents/${incidentId}/escalate`, {
                method: 'PATCH'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                } else {
                    showNotification('Urgence escaladée avec succès!', 'success');
                    // Actualiser l'affichage de l'incident
                    updateIncidentRow(incidentId, data);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showNotification('Erreur lors de l\'escalade', 'error');
            });
        }
    });

    // Gestion de la mise à jour du statut
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('status-select')) {
            const incidentId = e.target.dataset.id;
            const newStatus = e.target.value;
            
            fetch(`/api/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                    // Remettre l'ancienne valeur
                    e.target.value = e.target.dataset.originalValue;
                } else {
                    showNotification('Statut mis à jour avec succès!', 'success');
                    e.target.dataset.originalValue = newStatus;
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la mise à jour du statut', 'error');
                e.target.value = e.target.dataset.originalValue;
            });
        }
    });
});

// Fonction pour afficher les notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        transition: opacity 0.5s ease;
        ${type === 'success' ? 'background-color: #28a745;' : 'background-color: #dc3545;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Fonction pour mettre à jour la liste des incidents
function updateIncidentsList(incidents) {
    const incidentsContainer = document.querySelector('.incidents-list');
    if (!incidentsContainer) return;
    
    incidentsContainer.innerHTML = '';
    
    if (incidents.length === 0) {
        incidentsContainer.innerHTML = '<p class="no-incidents">Aucun incident trouvé.</p>';
        return;
    }
    
    incidents.forEach(incident => {
        const incidentElement = createIncidentElement(incident);
        incidentsContainer.appendChild(incidentElement);
    });
}

// Fonction pour créer un élément incident
function createIncidentElement(incident) {
    const div = document.createElement('div');
    div.className = 'incident-card';
    div.innerHTML = `
        <div class="incident-header">
            <h3>${incident.title}</h3>
            <span class="urgency-badge urgency-${incident.urgency}">${incident.urgency}</span>
        </div>
        <div class="incident-body">
            <p><strong>Type:</strong> ${incident.type}</p>
            <p><strong>Zone:</strong> ${incident.zone}</p>
            <p><strong>Description:</strong> ${incident.description || 'Aucune description'}</p>
            <p><strong>Statut:</strong> 
                <select class="status-select" data-id="${incident.id}" data-original-value="${incident.status}">
                    <option value="ouvert" ${incident.status === 'ouvert' ? 'selected' : ''}>Ouvert</option>
                    <option value="en cours" ${incident.status === 'en cours' ? 'selected' : ''}>En cours</option>
                    <option value="résolu" ${incident.status === 'résolu' ? 'selected' : ''}>Résolu</option>
                    <option value="fermé" ${incident.status === 'fermé' ? 'selected' : ''}>Fermé</option>
                </select>
            </p>
        </div>
        <div class="incident-actions">
            <button class="btn btn-escalate" data-id="${incident.id}">Escalader urgence</button>
            <small class="incident-date">Créé le: ${new Date(incident.createdAt).toLocaleDateString('fr-FR')}</small>
        </div>
    `;
    return div;
}

// Fonction pour mettre à jour une ligne d'incident
function updateIncidentRow(incidentId, updatedIncident) {
    const incidentCard = document.querySelector(`[data-id="${incidentId}"]`).closest('.incident-card');
    if (incidentCard) {
        const urgencyBadge = incidentCard.querySelector('.urgency-badge');
        if (urgencyBadge) {
            urgencyBadge.textContent = updatedIncident.urgency;
            urgencyBadge.className = `urgency-badge urgency-${updatedIncident.urgency}`;
        }
    }
}

// Fonction pour afficher les erreurs de formulaire
function displayFormErrors(errors) {
    // Supprimer les anciennes erreurs
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    
    errors.forEach(error => {
        const field = document.querySelector(`[name="${error.field}"]`);
        if (field) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.color = 'red';
            errorDiv.style.fontSize = '0.8em';
            errorDiv.textContent = error.message;
            field.parentNode.appendChild(errorDiv);
        }
    });
}