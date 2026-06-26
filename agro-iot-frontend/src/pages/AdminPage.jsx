import React, { useState } from "https://esm.sh/react@19.1.1";
import plusIcon from "../assets/icons/plus-solid.png";

const adminSections = [
  "Gestion des utilisateurs",
  "Etat des acces"
];

// A alimenter avec GET /users?page=1&limit=7.
const initialUserAccounts = [];

const emptyUserForm = {
  id_user: "",
  nom: "",
  email: "",
  role: "Agriculteur",
  status: "Invite",
  password: "",
  last_login: "--"
};

// Roles attendus par le frontend; le backend doit renvoyer les memes valeurs.
const roles = [
  {
    name: "Admin",
    permissions: ["Utilisateurs", "Roles", "Seuils", "Regles", "Historique", "Alertes", "Exports"]
  },
  {
    name: "Agriculteur",
    permissions: ["Dashboard", "Alertes", "Historique", "Commandes manuelles autorisees"]
  },
  {
    name: "Technicien",
    permissions: ["Capteurs", "Actionneurs", "Maintenance IoT", "Diagnostic"]
  }
];

const accountStatuses = ["Actif", "Invite", "Inactif"];
const USERS_PER_PAGE = 7;
// A alimenter avec GET /access-logs?page=1&limit=7.
const accessLogs = [];

function createUserId(totalUsers) {
  return `USR-${String(totalUsers + 1).padStart(3, "0")}`;
}

export function AdminPage() {
  const [activeSection, setActiveSection] = useState(adminSections[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState(initialUserAccounts);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userPage, setUserPage] = useState(1);
  const [accessPage, setAccessPage] = useState(1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    [user.nom, user.email, user.role, user.status].join(" ").toLowerCase().includes(normalizedSearch)
  );
  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeUserPage = Math.min(userPage, userPageCount);
  const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * USERS_PER_PAGE, safeUserPage * USERS_PER_PAGE);
  const userStartIndex = filteredUsers.length === 0 ? 0 : (safeUserPage - 1) * USERS_PER_PAGE + 1;
  const userEndIndex = Math.min(safeUserPage * USERS_PER_PAGE, filteredUsers.length);
  const filteredAccessLogs = accessLogs.filter((log) =>
    [log.utilisateur, log.heure_connexion, log.heure_deconnexion, log.commande].join(" ").toLowerCase().includes(normalizedSearch)
  );
  const accessPageCount = Math.max(1, Math.ceil(filteredAccessLogs.length / USERS_PER_PAGE));
  const safeAccessPage = Math.min(accessPage, accessPageCount);
  const paginatedAccessLogs = filteredAccessLogs.slice((safeAccessPage - 1) * USERS_PER_PAGE, safeAccessPage * USERS_PER_PAGE);
  const accessStartIndex = filteredAccessLogs.length === 0 ? 0 : (safeAccessPage - 1) * USERS_PER_PAGE + 1;
  const accessEndIndex = Math.min(safeAccessPage * USERS_PER_PAGE, filteredAccessLogs.length);

  const openCreateUserModal = () => {
    setEditingUserId(null);
    setUserForm({ ...emptyUserForm, id_user: createUserId(users.length) });
    setIsUserModalOpen(true);
  };

  const openViewUserModal = (user) => {
    setEditingUserId(user.id_user);
    setUserForm(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setUserForm(emptyUserForm);
  };

  // A connecter a DELETE /users/:id_user lorsque le backend sera pret.
  const deleteUser = (userId) => {
    setUsers((currentUsers) => currentUsers.filter((user) => user.id_user !== userId));
  };

  const updateUserForm = (field, value) => {
    setUserForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  // A connecter a POST /users ou PUT /users/:id_user selon le mode du formulaire.
  const saveUser = (event) => {
    event.preventDefault();

    if (editingUserId) {
      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id_user === editingUserId ? { ...userForm, id_user: editingUserId } : user
      )));
    } else {
      setUsers((currentUsers) => [...currentUsers, { ...userForm, id_user: userForm.id_user || createUserId(currentUsers.length) }]);
    }

    closeUserModal();
  };

  return (
    <section className="panel wide-panel admin-page-panel">
      <div className="admin-toolbar">
        <nav className="admin-tabs" aria-label="Options administration">
          {adminSections.map((section) => (
            <button
              key={section}
              type="button"
              className={activeSection === section ? "active" : ""}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="admin-search-group">
          <input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setUserPage(1); setAccessPage(1); }} placeholder="Search..." />
          <button className="toolbar-button" type="button" onClick={() => { setSearchTerm(""); setUserPage(1); setAccessPage(1); }}>Clear</button>
        </div>
      </div>

      {activeSection === "Gestion des utilisateurs" && (
        <section className="admin-section-content">
          <div className="admin-section-header">
            <div>
              <h3>Gestion des utilisateurs</h3>
              <p>Creation, modification, suppression et attribution des roles predefinis.</p>
            </div>
            <button className="primary-button small icon-button" type="button" onClick={openCreateUserModal}>
              <img src={plusIcon} alt="" />
              Ajouter utilisateur
            </button>
          </div>

          <div className="table-wrap admin-users-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id_user}>
                    <td>{user.nom}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => openViewUserModal(user)}>Voir</button>
                        <button type="button" onClick={() => deleteUser(user.id_user)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr className="empty-table-row">
                    <td colSpan="5">Aucun utilisateur trouve</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > USERS_PER_PAGE && (
            <div className="users-pagination" aria-label="Pagination des utilisateurs">
              <span>{userStartIndex}-{userEndIndex} sur {filteredUsers.length} utilisateurs</span>
              <div>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setUserPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={safeUserPage === 1}
                >
                  Precedent
                </button>
                <strong>Page {safeUserPage} / {userPageCount}</strong>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setUserPage((currentPage) => Math.min(userPageCount, currentPage + 1))}
                  disabled={safeUserPage === userPageCount}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeSection === "Etat des acces" && (
        <section className="admin-section-content">
          <div className="admin-section-header">
            <div>
              <h3>Etat des acces</h3>
              <p>Suivi des comptes actifs, connexions, deconnexions et commandes effectuees.</p>
            </div>
          </div>
          <div className="access-log-table">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Connexion</th>
                  <th>Deconnexion</th>
                  <th>Commande</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAccessLogs.map((log) => (
                  <tr key={log.id_log}>
                    <td>{log.utilisateur}</td>
                    <td>{log.heure_connexion}</td>
                    <td>{log.heure_deconnexion}</td>
                    <td>{log.commande}</td>
                  </tr>
                ))}
                {filteredAccessLogs.length === 0 && (
                  <tr className="empty-table-row">
                    <td colSpan="4">Aucun acces trouve</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredAccessLogs.length > USERS_PER_PAGE && (
            <div className="users-pagination" aria-label="Pagination des acces">
              <span>{accessStartIndex}-{accessEndIndex} sur {filteredAccessLogs.length} acces</span>
              <div>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setAccessPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={safeAccessPage === 1}
                >
                  Precedent
                </button>
                <strong>Page {safeAccessPage} / {accessPageCount}</strong>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setAccessPage((currentPage) => Math.min(accessPageCount, currentPage + 1))}
                  disabled={safeAccessPage === accessPageCount}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {isUserModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="user-modal" onSubmit={saveUser}>
            <div className="modal-header">
              <div>
                <h3>{editingUserId ? "Fiche utilisateur" : "Ajouter utilisateur"}</h3>
              </div>
              <button type="button" className="modal-close" onClick={closeUserModal}>Fermer</button>
            </div>

            <div className="form-grid">
              <label>
                Nom utilisateur
                <input value={userForm.nom} onChange={(event) => updateUserForm("nom", event.target.value)} required />
              </label>
              <label>
                Email
                <input type="email" value={userForm.email} onChange={(event) => updateUserForm("email", event.target.value)} required />
              </label>
              <label>
                Role
                <select value={userForm.role} onChange={(event) => updateUserForm("role", event.target.value)}>
                  {roles.map((role) => <option key={role.name} value={role.name}>{role.name}</option>)}
                </select>
              </label>
              <label>
                Statut compte
                <select value={userForm.status} onChange={(event) => updateUserForm("status", event.target.value)}>
                  {accountStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                Mot de passe
                <input
                  type="text"
                  value={userForm.password}
                  onChange={(event) => updateUserForm("password", event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="toolbar-button" onClick={closeUserModal}>Annuler</button>
              <button type="submit" className="primary-button small">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

