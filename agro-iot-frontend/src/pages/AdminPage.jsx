import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { logAudit } from "../api/audit";
import plusIcon from "../assets/icons/plus-solid.png";

const adminSections = [
  "Gestion des utilisateurs",
  "Etat des acces"
];

const emptyUserForm = {
  id: null,
  id_user: "",
  nom: "",
  email: "",
  role: "Agriculteur",
  status: "Invite",
  password: ""
};

const roles = ["Admin", "Agriculteur", "Technicien"];
const accountStatuses = ["Actif", "Invite", "Inactif"];
const USERS_PER_PAGE = 7;

function createUserId(totalUsers) {
  return `USR-${String(totalUsers + 1).padStart(3, "0")}`;
}

function getNumericUserId(user) {
  return user.id ?? String(user.id_user ?? "").replace("USR-", "");
}

function getAuditDay(value) {
  return String(value || "").slice(0, 10) || "Date inconnue";
}

function groupLogsByDay(logs) {
  const groups = new Map();

  logs.forEach((log) => {
    const userKey = log.utilisateur || "Utilisateur inconnu";
    const dayKey = getAuditDay(log.heure_connexion);
    const key = `${userKey}-${dayKey}`;

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        utilisateur: userKey,
        role: log.user_role || log.role || "--",
        day: dayKey,
        firstActivity: log.heure_connexion,
        lastActivity: log.heure_connexion,
        failedCount: 0,
        loginCount: 0,
        sessionIds: new Set(),
        actions: []
      });
    }

    const group = groups.get(key);
    group.actions.push(log);

    if (String(log.heure_connexion || "") < String(group.firstActivity || "")) {
      group.firstActivity = log.heure_connexion;
    }

    if (String(log.heure_connexion || "") > String(group.lastActivity || "")) {
      group.lastActivity = log.heure_connexion;
    }

    if (log.session_id) {
      group.sessionIds.add(log.session_id);
    }

    if (log.commande_type === "login" || log.commande === "Connexion reussie") {
      group.loginCount += 1;
    }

    if (log.commande_type === "failed" || log.statut === "failed") {
      group.failedCount += 1;
    }
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      sessionCount: group.sessionIds.size || group.loginCount,
      actions: group.actions.sort((a, b) => String(b.heure_connexion).localeCompare(String(a.heure_connexion)))
    }))
    .sort((a, b) => String(b.lastActivity).localeCompare(String(a.lastActivity)));
}
function getPageMeta(rows, page) {
  const pageCount = Math.max(1, Math.ceil(rows.length / USERS_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const startIndex = rows.length === 0 ? 0 : (safePage - 1) * USERS_PER_PAGE + 1;
  const endIndex = Math.min(safePage * USERS_PER_PAGE, rows.length);
  const paginatedRows = rows.slice((safePage - 1) * USERS_PER_PAGE, safePage * USERS_PER_PAGE);

  return { pageCount, safePage, startIndex, endIndex, paginatedRows };
}

export function AdminPage() {
  const [activeSection, setActiveSection] = useState(adminSections[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userPage, setUserPage] = useState(1);
  const [accessPage, setAccessPage] = useState(1);
  const [selectedAuditSession, setSelectedAuditSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      setIsLoading(true);
      setLoadError("");

      try {
        if (activeSection === "Gestion des utilisateurs") {
          const usersResponse = await api.get("/api/users", { params: { limit: 50 } });

          if (isMounted) {
            setUsers(usersResponse.data?.rows ?? []);
          }
        }

        if (activeSection === "Etat des acces") {
          const accessResponse = await api.get("/api/access-logs", { params: { limit: 120 } });

          if (isMounted) {
            setAccessLogs(accessResponse.data?.rows ?? []);
          }
        }
      } catch (error) {
        if (isMounted) {
          setLoadError("Impossible de charger l'administration depuis Laravel");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [activeSection]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => users.filter((user) =>
    [user.nom, user.email, user.role, user.status].join(" ").toLowerCase().includes(normalizedSearch)
  ), [normalizedSearch, users]);

  const filteredAccessLogs = useMemo(() => accessLogs.filter((log) =>
    [log.utilisateur, log.heure_connexion, log.page, log.commande, log.details, log.statut].join(" ").toLowerCase().includes(normalizedSearch)
  ), [accessLogs, normalizedSearch]);

  const userMeta = getPageMeta(filteredUsers, userPage);
  const groupedAccessSessions = useMemo(() => groupLogsByDay(filteredAccessLogs), [filteredAccessLogs]);
  const accessMeta = getPageMeta(groupedAccessSessions, accessPage);

  const openCreateUserModal = () => {
    setEditingUserId(null);
    setFormError("");
    setUserForm({ ...emptyUserForm, id_user: createUserId(users.length) });
    setIsUserModalOpen(true);
  };

  const openViewUserModal = (user) => {
    setEditingUserId(getNumericUserId(user));
    setFormError("");
    setUserForm({ ...emptyUserForm, ...user, password: "" });
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setFormError("");
    setUserForm(emptyUserForm);
  };

  const deleteUser = async (user) => {
    const userId = getNumericUserId(user);

    if (!userId) {
      return;
    }

    try {
      await api.delete(`/api/users/${userId}`);
      setUsers((currentUsers) => currentUsers.filter((item) => getNumericUserId(item) !== String(userId)));
      logAudit({ page: "Administration", action: "Suppression utilisateur", details: `${user.nom} - ${user.email}` });
    } catch (error) {
      setLoadError("Impossible de supprimer cet utilisateur");
    }
  };

  const updateUserForm = (field, value) => {
    setUserForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError("");

    const payload = {
      nom: userForm.nom,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
      password: userForm.password
    };

    try {
      if (editingUserId) {
        const response = await api.put(`/api/users/${editingUserId}`, payload);
        setUsers((currentUsers) => currentUsers.map((user) => (
          getNumericUserId(user) === String(editingUserId) ? response.data : user
        )));
        logAudit({ page: "Administration", action: "Modification utilisateur", details: `${response.data.nom} - ${response.data.email} - ${response.data.role}` });
      } else {
        const response = await api.post("/api/users", payload);
        setUsers((currentUsers) => [...currentUsers, response.data]);
        logAudit({ page: "Administration", action: "Creation utilisateur", details: `${response.data.nom} - ${response.data.email} - ${response.data.role}` });
      }

      closeUserModal();
    } catch (error) {
      setFormError("Impossible d'enregistrer cet utilisateur");
    } finally {
      setIsSaving(false);
    }
  };

  const userEmptyLabel = loadError || (isLoading ? "Chargement des utilisateurs..." : "Aucun utilisateur trouve");
  const accessEmptyLabel = loadError || (isLoading ? "Chargement des acces..." : "Aucun acces trouve");

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
                {userMeta.paginatedRows.map((user) => (
                  <tr key={user.id_user}>
                    <td>{user.nom}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => openViewUserModal(user)}>Voir</button>
                        <button type="button" onClick={() => deleteUser(user)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr className="empty-table-row">
                    <td colSpan="5">{userEmptyLabel}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > USERS_PER_PAGE && (
            <div className="users-pagination" aria-label="Pagination des utilisateurs">
              <span>{userMeta.startIndex}-{userMeta.endIndex} sur {filteredUsers.length} utilisateurs</span>
              <div>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setUserPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={userMeta.safePage === 1}
                >
                  Precedent
                </button>
                <strong>Page {userMeta.safePage} / {userMeta.pageCount}</strong>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setUserPage((currentPage) => Math.min(userMeta.pageCount, currentPage + 1))}
                  disabled={userMeta.safePage === userMeta.pageCount}
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
              <p>Journal d audit des connexions, pages consultees, exports, alertes et actions realisees.</p>
            </div>
          </div>
          <div className="audit-summary-table-wrap">
            <table className="audit-summary-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Role</th>
                  <th>Jour</th>
                  <th>Derniere activite</th>
                  <th>Connexions</th>
                  <th>Actions</th>
                  <th>Statut</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {accessMeta.paginatedRows.map((session) => (
                  <tr key={session.id}>
                    <td><strong>{session.utilisateur}</strong></td>
                    <td>{session.role}</td>
                    <td>{session.day}</td>
                    <td>{session.lastActivity}</td>
                    <td>{session.sessionCount}</td>
                    <td>{session.actions.length}</td>
                    <td>
                      {session.failedCount > 0 ? (
                        <span className="audit-warning-pill">{session.failedCount} echec(s)</span>
                      ) : (
                        <span className="audit-success-pill">OK</span>
                      )}
                    </td>
                    <td>
                      <button className="toolbar-button" type="button" onClick={() => setSelectedAuditSession(session)}>
                        Voir detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAccessLogs.length === 0 && (
              <div className="alerts-empty-state">
                <strong>{accessEmptyLabel}</strong>
              </div>
            )}
          </div>
          {groupedAccessSessions.length > USERS_PER_PAGE && (
            <div className="users-pagination" aria-label="Pagination des acces">
              <span>{accessMeta.startIndex}-{accessMeta.endIndex} sur {groupedAccessSessions.length} journees</span>
              <div>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setAccessPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={accessMeta.safePage === 1}
                >
                  Precedent
                </button>
                <strong>Page {accessMeta.safePage} / {accessMeta.pageCount}</strong>
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => setAccessPage((currentPage) => Math.min(accessMeta.pageCount, currentPage + 1))}
                  disabled={accessMeta.safePage === accessMeta.pageCount}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {selectedAuditSession && (
        <div className="modal-backdrop" role="presentation">
          <section className="user-modal audit-detail-modal" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title">
            <div className="audit-detail-topbar">
              <div>
                <h3 id="audit-detail-title">Detail de la journee</h3>
                <p>{selectedAuditSession.utilisateur} - {selectedAuditSession.role} - {selectedAuditSession.day}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedAuditSession(null)}>Fermer</button>
            </div>
            <div className="audit-timeline">
              {selectedAuditSession.actions.map((log) => (
                <article className={`audit-timeline-item ${log.commande_type || "action"}`} key={log.id_log}>
                  <div className="audit-timeline-meta">
                    <strong>{log.heure_connexion}</strong>
                    <span>{log.page || "--"}</span>
                  </div>
                  <div className="audit-timeline-body">
                    <div className="audit-timeline-title">
                      <span className={`command-badge ${log.commande_type || "action"}`}>{log.commande}</span>
                      <span className={`audit-status ${log.statut || "success"}`}>{log.statut || "success"}</span>
                    </div>
                    <p>{log.details || "--"}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
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

            {formError && <div className="alerts-empty-state"><strong>{formError}</strong></div>}

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
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
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
                  required={!editingUserId}
                  placeholder={editingUserId ? "Laisser vide pour conserver" : ""}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="toolbar-button" onClick={closeUserModal}>Annuler</button>
              <button type="submit" className="primary-button small" disabled={isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
