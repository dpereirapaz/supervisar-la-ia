# Cómo lanzarlo (kit v2: con informe PDF personalizado)

## 1. Preparar
mkdir supervisar-la-ia && cd supervisar-la-ia
# Desde la carpeta del kit:
cp -r /ruta/cc-starter/. .              # CLAUDE.md, .claude/, SPEC_*.md, report/, PROMPT_arranque.md
cp /ruta/cc-starter/settings.user.json ~/.claude/settings.json    # o fusiónalo con el que ya tengas
git init

# Sustituye dpereirapaz (dpereirapaz) en settings.json y en PROMPT_arranque.md.
# Comprueba la versión: claude --version  (auto mode necesita 2.1.228+; Fable 5.1, 2.1.257+)
# Comprueba que gh está autenticado: gh auth status
# Comprueba Node 20 o superior y poppler-utils (pdftoppm, pdftotext).

## 2. Sesión interactiva sin preguntas (recomendado)
claude --model fable --permission-mode auto
# Pega el contenido de PROMPT_arranque.md.

## 3. Sesión totalmente desatendida (solo dentro de un contenedor o VM)
claude -p "$(cat PROMPT_arranque.md)" --model fable --dangerously-skip-permissions --output-format text

## 4. Si auto mode bloquea algo
claude auto-mode config
# Añade el dominio o la acción a autoMode.environment o autoMode.allow en ~/.claude/settings.json

## 5. Lo que Claude Code NO hace (te toca a ti, anexo sección 15)
1. Comprar el dominio y apuntarlo a Netlify.
2. Crear la cuenta de Netlify, conectar el repositorio de GitHub y poner las variables de entorno.
3. Crear la cuenta de Brevo, autenticar el dominio (SPF, DKIM, DMARC) y crear la clave de API.
4. Dar el enlace privado del whitebook, las direcciones de correo y los datos legales.
5. Pedir la revisión jurídica de las páginas legales.
6. Probar en producción con tu correo (AR-13).

## 6. Probar el informe en local sin enviar nada
npm ci
npm test                                  # 9+ pruebas
npx netlify dev --offline                 # con DELIVERY_MODE=download en un .env local sin secretos
