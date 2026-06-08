"""
Streamlit wrapper for the static planner web app.

The original app is pure HTML/CSS/JS (planner.html / planner_style.css /
planner_script.js). Streamlit renders HTML inside a sandboxed iframe, which
cannot load the sibling .css/.js files by relative path, so at runtime we
inline both files into the HTML before handing it to components.html.

The three source files stay untouched — edit them as usual and Streamlit
picks up the changes on rerun.
"""

import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

BASE_DIR = Path(__file__).parent

st.set_page_config(page_title="Planner", layout="wide")

# Hide Streamlit's default chrome so the planner fills the page.
st.markdown(
    """
    <style>
      #MainMenu, header, footer {visibility: hidden;}
      .block-container {padding: 0 !important; max-width: 100% !important;}
    </style>
    """,
    unsafe_allow_html=True,
)


def build_inlined_html() -> str:
    html = (BASE_DIR / "planner.html").read_text(encoding="utf-8")
    css = (BASE_DIR / "planner_style.css").read_text(encoding="utf-8")
    js = (BASE_DIR / "planner_script.js").read_text(encoding="utf-8")

    # Replace <link ... href="planner_style.css?..."> with an inline <style>.
    html = re.sub(
        r'<link[^>]*href="planner_style\.css[^"]*"[^>]*>',
        f"<style>\n{css}\n</style>",
        html,
        count=1,
    )

    # Replace <script src="planner_script.js?..."></script> with inline JS.
    html = re.sub(
        r'<script[^>]*src="planner_script\.js[^"]*"[^>]*>\s*</script>',
        f"<script>\n{js}\n</script>",
        html,
        count=1,
    )

    return html


components.html(build_inlined_html(), height=2000, scrolling=True)
