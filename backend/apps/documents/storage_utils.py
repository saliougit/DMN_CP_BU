import boto3
from botocore.client import Config as BotoConfig
from django.conf import settings

# Bucket privé (voir STORAGES dans settings/production.py et
# docker-compose.prod.yml::storage-init) : on signe avec l'endpoint interne
# (même hôte que le client S3 de django-storages, "storage:9000") puis on
# substitue juste le host/schéma public dans l'URL retournée. La signature
# SigV4 porte sur le header Host utilisé à la signature — le nginx du
# sous-domaine storage force ce même Host interne en amont (voir
# deploy/nginx/storage-bnumerique.dmnucad.com.conf), donc la signature reste
# valide quel que soit le domaine utilisé par le navigateur pour y accéder.
DEFAULT_EXPIRES = 600


def presigned_file_url(key: str, expires: int = DEFAULT_EXPIRES) -> str:
    client = boto3.client(
        "s3",
        endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"}),
        region_name="us-east-1",
    )
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
    internal_prefix = f"http://{settings.MINIO_ENDPOINT}/"
    public_prefix = f"{settings.MINIO_URL_PROTOCOL}//{settings.MINIO_PUBLIC_ENDPOINT}/"
    return url.replace(internal_prefix, public_prefix, 1)
