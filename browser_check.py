#!/usr/bin/env python3
"""Real-browser check (optional). Needs: pip install playwright && playwright install chromium
Opens the home screen, the lesson, every skill station and scenario at phone sizes, taps real buttons,
and fails on any JavaScript error or anything off-screen.   Usage: python3 tests/browser_check.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
OVER = "(()=>{let m=0;document.querySelectorAll('body *').forEach(e=>{if(e.offsetParent===null)return;const r=e.getBoundingClientRect();m=Math.max(m,r.right-window.innerWidth);});return Math.round(m);})()"
errs, rows = [], []
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (320, 390):
        pg = b.new_page(viewport={'width': w, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'home', pg.evaluate(OVER)))
        pg.click('#h-learn'); pg.wait_for_timeout(150); rows.append((w, 'lesson', pg.evaluate(OVER))); pg.click('[data-l="quit"]')
        for rid in ('tempo','adult','infant','bvm','chokeA','chokeI','team','opioid','baby','child'):
            pg.goto(URL); pg.wait_for_timeout(150); pg.click(f'[data-run="{rid}"]'); pg.wait_for_timeout(150)
            for _ in range(6):   # tap through the first few steps with real clicks
                for sel in ('[data-r="next"]','[data-r="opt"]','[data-r="seq"]','[data-r="timer"]','[data-r="tap"]','[data-r="alt"]','[data-r="rhythm"]','[data-r="breath"]'):
                    en = pg.locator(sel + ':not([disabled])')
                    if en.count(): en.first.click(); break
                pg.wait_for_timeout(80)
            rows.append((w, rid, pg.evaluate(OVER)))
        if w == 390:   # play every activity to the end with REAL clicks, finding buttons by their visible text
            for rid in ('tempo','adult','infant','bvm','chokeA','chokeI','team','opioid','baby','child'):
                pg.goto(URL); pg.wait_for_timeout(150); pg.evaluate("window.__t=1000;NOW=()=>window.__t;")
                pg.click(f'[data-run="{rid}"]'); ok = False
                for _ in range(400):
                    if pg.is_visible('#doneov'): ok = True; break
                    k = pg.evaluate("RUN&&RUN.steps[RUN.i]?RUN.steps[RUN.i].k:null")
                    if k is None: continue
                    adv = lambda s: pg.evaluate(f"window.__t+={s}")
                    def woke(sel):   # a person waits for a just-appeared button to be ready (the half-second guard)
                        if 'cool' in (pg.locator(sel).first.get_attribute('class') or ''): adv(0.5); pg.wait_for_timeout(200)
                    if k == 'info' or pg.locator('[data-r="next"]').count(): adv(1); woke('[data-r="next"]'); pg.click('[data-r="next"]'); continue
                    if k == 'choice':
                        good = pg.evaluate("(()=>{const s=RUN.steps[RUN.i];return s.o.find(o=>o[1]==='good')[0];})()")
                        adv(1); woke('[data-r="opt"]'); pg.locator('[data-r="opt"]', has_text=good).first.click(); continue
                    if k == 'seq':
                        want = pg.evaluate("RUN.steps[RUN.i].items[RUN.st.next]")
                        adv(1); woke('[data-r="seq"]'); pg.locator('[data-r="seq"]', has_text=want).first.click(); continue
                    if k == 'timer': adv(1); woke('[data-r="timer"]'); pg.click('[data-r="timer"]'); adv(7); pg.click('[data-r="timer"]'); continue
                    if k == 'tap': adv(0.545); woke('[data-r="tap"]'); pg.click('[data-r="tap"]'); continue
                    if k == 'breaths': adv(1.1); woke('[data-r="breath"]'); pg.click('[data-r="breath"]'); continue
                    if k == 'rhythm': adv(6); woke('[data-r="rhythm"]'); pg.click('[data-r="rhythm"]'); continue
                    if k == 'alt':
                        x = pg.evaluate("RUN.st.inCyc<5?'a':'b'"); adv(0.6); woke(f'[data-r="alt"][data-x="{x}"]'); pg.click(f'[data-r="alt"][data-x="{x}"]'); continue
                score = pg.text_content('#done-s') if ok else '—'
                rows.append((w, rid + ' (full)', 0 if ok and score == '100' else 99))
        pg.goto(URL); pg.wait_for_timeout(150); pg.click('#h-exam'); pg.wait_for_timeout(150); rows.append((w, 'exam', pg.evaluate(OVER)))
        pg.close()
    b.close()
for r in rows: print(f"{'PASS' if r[2] <= 1 else 'FAIL'}  {r[0]}px  {r[1]:<14} " + ("completed with real taps, score 100" if 'full' in r[1] and r[2] <= 1 else "DID NOT COMPLETE with real taps" if 'full' in r[1] else f"overflow {r[2]}px"))
print('JavaScript errors:', errs or 'none')
sys.exit(1 if [r for r in rows if r[2] > 1] or errs else 0)
