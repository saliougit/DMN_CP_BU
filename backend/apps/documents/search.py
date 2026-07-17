"""Couche d'abstraction Meilisearch pour l'indexation des documents."""
import meilisearch
from django.conf import settings


def _client() -> meilisearch.Client:
    return meilisearch.Client(settings.MEILISEARCH_URL, settings.MEILISEARCH_MASTER_KEY)


def _index() -> meilisearch.Index:
    return _client().index("documents")


def ensure_index() -> None:
    """Configure les attributs filtrables/cherchables au démarrage.
    Appelée dans DocumentsConfig.ready() — échec silencieux si Meilisearch indisponible."""
    try:
        idx = _index()
        idx.update_searchable_attributes(["titre", "auteur", "resume", "mots_cles", "directeur"])
        idx.update_filterable_attributes(["statut", "faculte", "filiere", "niveau", "type", "annee"])
        idx.update_sortable_attributes(["annee", "date_soumission"])
    except Exception:
        pass


def index_document(doc) -> None:
    """Indexe (ou réindexe) un document approuvé."""
    try:
        _index().add_documents([{
            "id":              str(doc.id),
            "titre":           doc.titre,
            "auteur":          doc.auteur,
            "type":            doc.type,
            "statut":          doc.statut,
            "faculte":         doc.faculte.nom  if doc.faculte_id  else "",
            "filiere":         doc.filiere.nom  if doc.filiere_id  else "",
            "niveau":          doc.niveau.nom   if doc.niveau_id   else "",
            "annee":           doc.annee,
            "resume":          doc.resume        or "",
            "mots_cles":       doc.mots_cles    or [],
            "directeur":       doc.directeur    or "",
            "date_soumission": doc.date_soumission.isoformat() if doc.date_soumission else "",
        }])
    except Exception:
        pass


def delete_from_index(doc_id: str) -> None:
    """Retire un document de l'index (rejet ou suppression)."""
    try:
        _index().delete_document(str(doc_id))
    except Exception:
        pass
