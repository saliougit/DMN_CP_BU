"""Couche d'abstraction Meilisearch pour l'indexation des documents."""
import meilisearch
from django.conf import settings


def _client() -> meilisearch.Client:
    return meilisearch.Client(settings.MEILISEARCH_URL, settings.MEILISEARCH_MASTER_KEY)


def _index():
    return _client().index("documents")


def ensure_index() -> None:
    """Configure les attributs filtrables/cherchables au démarrage.
    Appelée dans DocumentsConfig.ready() — échec silencieux si Meilisearch indisponible."""
    try:
        idx = _index()
        idx.update_searchable_attributes(["titre", "auteur", "resume", "mots_cles", "directeur", "contenu_texte"])
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
            "contenu_texte":   doc.contenu_texte or "",
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


def search_documents(query: str, filters: dict, limit: int = 200) -> list[str] | None:
    """Recherche plein texte (tolerante aux fautes/accents) + facettes.

    L'index ne contient que les documents approuves (voir index_document),
    ce qui correspond exactement a ce que la recherche publique doit voir.
    Retourne la liste des ids (ordonnes par pertinence), ou None si
    Meilisearch est indisponible — le site retombe alors sur une recherche
    SQL degradee plutot que de planter (voir DocumentViewSet.list).
    """
    clauses = []
    for field in ("faculte", "filiere", "niveau", "type"):
        value = filters.get(field)
        if value:
            escaped = str(value).replace('\\', '\\\\').replace('"', '\\"')
            clauses.append(f'{field} = "{escaped}"')
    annee = filters.get("annee")
    if annee and str(annee).isdigit():
        clauses.append(f"annee = {int(annee)}")

    try:
        result = _index().search(query, {
            "filter": " AND ".join(clauses) if clauses else None,
            "limit": limit,
            "attributesToRetrieve": ["id"],
        })
        return [hit["id"] for hit in result["hits"]]
    except Exception:
        return None
