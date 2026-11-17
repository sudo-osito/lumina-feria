"""Exporta la presentación al tema Neisstech 3.0 de Shopify (www.neisstech.com/presentacion-feria).
Los assets de un tema son planos: cada archivo pasa a «feria__carpeta__archivo» y se reescriben los imports y las rutas.
La plantilla page.nt3-presentacion-feria.liquid (sin layout) pone <base> en la carpeta de assets, así todo lo relativo
(imágenes, videos, fuentes, módulos) resuelve allí. El 404 del tema manda /presentacion-feria a esa vista.
Uso: python3 herramientas/exportar_shopify.py <salida> <sections/nt3-pagina.liquid del tema>"""
import pathlib, re, subprocess, sys, shutil
RAIZ = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]); sec = pathlib.Path(sys.argv[2])
if sal.exists(): shutil.rmtree(sal)
(sal / 'assets').mkdir(parents=True); (sal / 'templates').mkdir(); (sal / 'sections').mkdir()
archivos = [a for a in subprocess.run(['git', 'ls-files'], cwd=RAIZ, capture_output=True, text=True).stdout.split()
            if not a.startswith(('.', 'herramientas/')) and a != 'index.html']
plano = lambda ruta: 'feria__' + ruta.replace('/', '__')
TEXTO = ('.js', '.css', '.json', '.svg')

def reescribir(txt, ruta):
    carpeta = pathlib.PurePosixPath(ruta).parent
    def imp(m):   # imports: relativos al módulo → nombre plano en la misma carpeta de assets
        esp = m.group(2); limpio = esp.split('?')[0]
        destino = pathlib.PurePosixPath(*[p for p in (carpeta / limpio).parts])
        partes = []
        for p in destino.parts:
            if p == '..': partes.pop()
            elif p != '.': partes.append(p)
        return f"{m.group(1)}./{plano('/'.join(partes))}{m.group(3)}"
    txt = re.sub(r"""((?:\bfrom\s*|\bimport\s*\(\s*)['"])(\.{1,2}/[^'"]+)(['"])""", imp, txt)
    # rutas de recursos relativas a la raíz de la presentación (imágenes, videos, fuentes, letreros)
    txt = re.sub(r"(?<![\w/.:-])(img|recursos|vendor)/([\w-]+)/", lambda m: f"feria__{m.group(1)}__{m.group(2)}__", txt)
    txt = re.sub(r"(?<![\w/.:-])(presentacion\.(?:css|js))", r"feria__\1", txt)
    return txt

for a in archivos:
    org = RAIZ / a; dst = sal / 'assets' / plano(a)
    if org.suffix in TEXTO:
        t = reescribir(org.read_text(), a)
        if a == 'presentacion.js':   # con <base>, la URL relativa del replaceState iría a la carpeta de assets
            t = t.replace('history.replaceState(null, "", `${location.search}#', 'history.replaceState(null, "", `${location.pathname}${location.search}#')
        dst.write_text(t)
    else: shutil.copy2(org, dst)
    if dst.stat().st_size > 19_000_000: sys.exit(f'demasiado grande para Shopify: {a}')

html = reescribir((RAIZ / 'index.html').read_text(), 'index.html')
cabeza = ("{%- layout none -%}{%- capture base -%}{{ 'feria__presentacion.js' | asset_url | split: 'feria__presentacion.js' | first }}{%- endcapture -%}")
limpia = ("<script>(function(){var q=new URLSearchParams(location.search),pv=q.get('preview_theme_id');"
          "if(q.get('nt3r')==='/presentacion-feria')history.replaceState(null,'','/presentacion-feria'+(pv?'?preview_theme_id='+pv:'')+location.hash);})();</script>")
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="{{ base }}">\n' + limpia + '\n{% raw %}', 1).replace('</html>', '{% endraw %}</html>')
(sal / 'templates' / 'page.nt3-presentacion-feria.liquid').write_text(cabeza + '\n' + html)

s = sec.read_text(); viejo = '"/portal": "https://arm.neisstech.com/portal"'
if '"/presentacion-feria"' not in s:
    assert viejo in s; s = s.replace(viejo, '"/presentacion-feria": 1, ' + viejo)
(sal / 'sections' / 'nt3-pagina.liquid').write_text(s)
n = len(list((sal / 'assets').iterdir())); peso = sum(f.stat().st_size for f in (sal / 'assets').iterdir())
print(f'ok · {n} assets · {peso / 1e6:.1f} MB')
