from django.db import migrations
import pgvector.django.vector


class Migration(migrations.Migration):
    dependencies = [
        ("rag", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vectorchunk",
            name="embedding",
            field=pgvector.django.vector.VectorField(dimensions=768, null=True),
        ),
    ]
