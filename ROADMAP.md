# Roadmap — DMN-BN

Backlog noté le 2026-11-16, à partir des retours utilisateur. Chaque item est à cocher une fois livré ET déployé.

---

## 1. Navigation admin ↔ membre

- [ ] Un admin est aussi un membre (il peut consulter/soumettre des documents comme tout membre) — faciliter le switch entre les deux interfaces (`/gestion/...` et le reste du site) depuis la nav, sans repasser par une reconnexion.

## 2. Refonte UI (composants "moches"/non finis)

- [ ] Remplacer les éléments bruts/mal stylés par des composants propres et cohérents (Base UI déjà en place dans le projet, ou shadcn) — à traiter progressivement, écran par écran.
- [ ] Exemple cité : le panneau qui s'ouvre au clic sur "Profil" (infos un peu collées, pas assez d'air/de structure).

## 3. Gestion des rôles (membre ↔ admin)

- [ ] Depuis l'interface admin : pouvoir changer le rôle d'un membre → admin, et inversement.
- [ ] **Règle** : un admin "normal" peut promouvoir un membre en admin, mais **ne peut pas** :
  - changer le rôle d'un autre admin (admin → membre),
  - changer le mot de passe d'un autre admin.
  Seul le **super admin** peut faire ces deux actions (le contrôle mot de passe existe déjà côté API — `AdminSetPasswordView` — à répliquer pour le changement de rôle).

## 4. Config : masquer "Publier/Approuver" sur les documents déjà rejetés

- [ ] Ajouter un paramètre (visible et modifiable depuis le Django admin) qui contrôle l'affichage des boutons "Publier"/"Approuver" sur un document déjà rejeté.
- [ ] **Par défaut : caché** (les boutons ne s'affichent pas sur un document rejeté, sauf si l'admin active explicitement le paramètre).

## 5. Sous-rôles admin par type de document (validation ciblée)

- [ ] Tous les admins voient toutes les soumissions, mais seuls ceux habilités peuvent les **valider** (approuver/rejeter) :
  - habilitation par type de document (thèse, mémoire master, mémoire licence, article, rapport...) ;
  - un admin sans l'habilitation sur un type voit le document mais pas le(s) bouton(s) d'action pour ce type ;
  - un admin peut cumuler plusieurs habilitations (ex : thèses + mémoires master) ;
  - le **super admin** n'a aucune restriction (peut tout valider, quel que soit le type).
- [ ] Gestion des habilitations : uniquement par le **super admin**, depuis l'API, au moment de la création ou de la modification d'un membre/admin (attribuer/révoquer).
- [ ] Les autres admins gardent leurs capacités actuelles sans restriction (créer un membre, le promouvoir en admin) — seule la gestion fine des habilitations de validation et la rétrogradation admin→membre sont réservées au super admin.

---

## Notes d'implémentation (à affiner en démarrant chaque item)

- "Super admin" : à priori le champ Django `is_superuser` déjà présent sur le modèle `User` peut servir directement de marqueur super admin applicatif, sans ajouter de nouveau champ.
- Habilitations par type (item 5) : probablement un champ liste (`ArrayField` de `TypeDocument`) sur `User`, du même genre que `mots_cles` sur `Document`.
- Config "boutons sur rejeté" (item 4) : un modèle singleton simple, édité via le Django admin, exposé en lecture par l'API pour le frontend.
