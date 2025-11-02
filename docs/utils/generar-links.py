import requests
import os
from datetime import datetime
import time

# ===============================
# ⚙️ CONFIGURACIÓN
# ===============================
USER = "sTr4yDev"          # Tu nombre de usuario en GitHub
REPO = "speakLexi2.0"      # Nombre del repositorio
BRANCH = "main"            # Rama principal
TOKEN = ""                 # (Opcional) Token de GitHub para evitar límites

# ===============================
# 🔗 URLs base
# ===============================
API_URL = f"https://api.github.com/repos/{USER}/{REPO}/branches/{BRANCH}"
RAW_BASE = f"https://raw.githubusercontent.com/{USER}/{REPO}/{BRANCH}/"


def obtener_commit_mas_reciente():
    """Obtiene el commit más reciente del branch."""
    headers = {"Authorization": f"token {TOKEN}"} if TOKEN else {}

    print("🔄 Verificando commit más reciente...")
    res = requests.get(API_URL, headers=headers)

    if res.status_code != 200:
        raise Exception(f"Error {res.status_code}: {res.text}")

    data = res.json()
    sha = data["commit"]["sha"]
    fecha = data["commit"]["commit"]["committer"]["date"]

    print(f"✅ Commit más reciente: {sha[:8]} ({fecha})")
    return sha


def clasificar_archivo(path):
    """Determina la categoría del archivo (backend, frontend, docs)."""
    lower = path.lower()

    if any(x in lower for x in ["api", "flask", "server", "models", "routes", "config"]) or lower.endswith(".py"):
        return "backend"
    elif any(x in lower for x in ["public", "html", "js", "css", "assets"]):
        return "frontend"
    elif any(lower.endswith(ext) for ext in [".md", ".pdf", ".txt", ".docx"]) or "docs" in lower:
        return "docs"
    else:
        return "otros"


def generar_raw_links():
    """Genera el archivo raw_links.txt sobrescribiéndolo cada vez."""
    sha = obtener_commit_mas_reciente()

    tree_url = f"https://api.github.com/repos/{USER}/{REPO}/git/trees/{sha}?recursive=1"
    headers = {"Authorization": f"token {TOKEN}"} if TOKEN else {}

    print("📡 Obteniendo estructura del repositorio...")
    res = requests.get(tree_url, headers=headers)
    res.raise_for_status()
    data = res.json()

    archivos = [item for item in data["tree"] if item["type"] == "blob"]

    print(f"📁 Total de archivos encontrados: {len(archivos)}")

    # Clasificación
    backend_links = []
    frontend_links = []
    docs_links = []
    otros_links = []

    for a in archivos:
        url = f"{RAW_BASE}{a['path']}"
        categoria = clasificar_archivo(a["path"])
        if categoria == "backend":
            backend_links.append(url)
        elif categoria == "frontend":
            frontend_links.append(url)
        elif categoria == "docs":
            docs_links.append(url)
        else:
            otros_links.append(url)

    # Generar salida
    ruta_salida = os.path.join(os.getcwd(), "raw_links.txt")
    with open(ruta_salida, "w", encoding="utf-8") as f:
        f.write(f"# RAW LINKS — Actualizado {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Repositorio: {USER}/{REPO}\n")
        f.write(f"# Commit: {sha}\n\n")

        f.write("========================= BACKEND LINKS =========================\n")
        f.writelines("\n".join(backend_links) + "\n\n")

        f.write("========================= FRONTEND LINKS =========================\n")
        f.writelines("\n".join(frontend_links) + "\n\n")

        f.write("========================= DOCS LINKS =========================\n")
        f.writelines("\n".join(docs_links) + "\n\n")

        if otros_links:
            f.write("========================= OTROS =========================\n")
            f.writelines("\n".join(otros_links) + "\n")

    print(f"✅ Archivo sobrescrito correctamente: {ruta_salida}")
    print(f"📊 {len(backend_links)} backend | {len(frontend_links)} frontend | {len(docs_links)} docs | {len(otros_links)} otros")


if __name__ == "__main__":
    inicio = time.time()
    try:
        generar_raw_links()
    except Exception as e:
        print(f"💥 Error: {e}")
    fin = time.time()
    print(f"⏱️ Tiempo total: {fin - inicio:.2f}s")
