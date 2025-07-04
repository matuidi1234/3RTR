// models/Incident.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  if (!sequelize || !sequelize.define) {
    throw new TypeError('Invalid Sequelize instance provided');
  }

  const Incident = sequelize.define('Incident', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le titre est requis'
        },
        len: {
          args: [3, 100],
          msg: 'Le titre doit contenir entre 3 et 100 caractères'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'La description ne peut excéder 2000 caractères'
        }
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Evasion', 'Panne', 'Blessure', 'bug', 'amélioration', 'tâche', 'autre']],
          msg: "Type d'incident non valide"
        }
      }
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La zone est requise'
        }
      }
    },
    urgency: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['faible', 'moyenne', 'haute', 'critique']],
          msg: "Niveau d'urgence non valide"
        }
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'ouvert',
      validate: {
        isIn: {
          args: [['ouvert', 'en cours', 'résolu', 'fermé']],
          msg: "Statut non valide"
        }
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'incidents',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: ['deletedAt']
      }
    },
    scopes: {
      withDeleted: {
        paranoid: false
      },
      urgent: {
        where: {
          urgency: 'haute'
        }
      }
    },
    validate: {
      checkUrgencyConsistency() {
        if (this.type === 'Blessure' && this.urgency === 'Basse') {
          throw new Error('Une blessure ne peut pas avoir une urgence basse');
        }
        if (this.type === 'Evasion' && this.urgency !== 'Haute') {
          throw new Error('Une évasion doit toujours être de haute urgence');
        }
      },
      checkZoneValidity() {
        const validZones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];
        if (this.zone && !validZones.includes(this.zone)) {
          throw new Error(`Zone invalide. Les zones valides sont: ${validZones.join(', ')}`);
        }
      },
      checkStatusTransition() {
        if (this.previous('status') === 'résolu' && this.status !== 'résolu') {
          throw new Error('Un incident résolu ne peut pas revenir à un statut antérieur');
        }
      }
    }
  });

  // Hooks pour une validation supplémentaire
  Incident.beforeUpdate(async (incident) => {
    if (incident.status === 'résolu' && !incident.description) {
      throw new Error('Une description est requise pour marquer un incident comme résolu');
    }
  });

  // Méthodes d'instance personnalisées
  Incident.prototype.escalateUrgency = function() {
    const urgencyLevels = ['faible', 'moyenne', 'haute', 'critique'];
    const currentIndex = urgencyLevels.indexOf(this.urgency);
    if (currentIndex < urgencyLevels.length - 1) {
      this.urgency = urgencyLevels[currentIndex + 1];
    }
    return this.save();
  };

  return Incident;
};