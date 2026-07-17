from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    name = 'apps.documents'

    def ready(self):
        import apps.documents.signals  # noqa: F401 — enregistre les signaux post_save/post_delete
        from . import search
        search.ensure_index()  # configure les attributs Meilisearch (échec silencieux si indisponible)
