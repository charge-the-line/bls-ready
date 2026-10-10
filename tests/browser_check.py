#!/usr/bin/env python3
"""Real-browser check (optional). Needs: pip install playwright && playwright install chromium
Opens the home screen, the lesson, every skill station and scenario at phone sizes, taps real buttons,
and fails on any JavaScript error or anything off-screen.   Usage: python3 tests/browser_check.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
OVER = "(()=>{let m=0;document.querySelectorAll('body *').forEach(e=>{if(e.offsetParent===null)return;const r=e.getBoundingClientRect();m=Math.max(m,r.right-window.innerWidth);});return Math.round(m);})()"
SMALL = "(()=>{let n=0;document.querySelectorAll('button').forEach(e=>{if(e.offsetParent===null)return;const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight)return;if(r.height<44)n++;});return n;})()"
errs, rows = [], []
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (320, 390):
        pg = b.new_page(viewport={'width': w, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'home', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL))))
        pg.click('#h-learn'); pg.wait_for_timeout(150); rows.append((w, 'lesson', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)))); pg.click('[data-l="quit"]')
        pg.click('#h-set'); pg.wait_for_timeout(150); rows.append((w, 'settings', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)))); pg.click('#set-close')
        pg.evaluate("localStorage.setItem('preconnect-drill',JSON.stringify({on:true,inst:'Max',roster:['Jo','Sam'],who:'',start:new Date().toISOString()}))"); pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'drill picker', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)))); pg.click('.pc-drill-name'); pg.wait_for_timeout(200); rows.append((w, 'drill bar', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)))); pg.evaluate("localStorage.removeItem('preconnect-drill')")
        for rid in ('tempo','adult','infant','child2','bvm','chokeA','chokeI','team','opioid','baby','child','pool','crib','slow'):
            pg.goto(URL); pg.wait_for_timeout(150); pg.click(f'[data-run="{rid}"]'); pg.wait_for_timeout(150)
            for _ in range(6):   # tap through the first few steps with real clicks
                for sel in ('[data-r="next"]','[data-r="opt"]','[data-r="seq"]','[data-r="timer"]','[data-r="tap"]','[data-r="alt"]','[data-r="rhythm"]','[data-r="breath"]'):
                    en = pg.locator(sel + ':not([disabled])')
                    if en.count(): en.first.click(); break
                pg.wait_for_timeout(80)
            rows.append((w, rid, (pg.evaluate(OVER)+1000*pg.evaluate(SMALL))))
        fulls = [(r, None) for r in ('tempo','adult','infant','child2','bvm','chokeA','chokeI','team','opioid','baby','child','pool','crib','slow')] if w == 390 else []
        fulls += [('pool', v) for v in 'ABCD']   # the four pool patients at both widths, pads placed by tapping their labels
        fulls += [('slow', v) for v in 'ABC']   # the three slow-pulse patients at both widths, gentle breaths tapped on the real clock
        for rid, force in fulls:   # play every activity to the end with REAL clicks, finding buttons by their visible text
                pg.goto(URL); pg.wait_for_timeout(150); pg.evaluate("window.__t=1000;NOW=()=>window.__t;")
                if force: pg.evaluate(f"window.FORCE_V={{{rid}:'{force}'}}")
                pg.click(f'[data-run="{rid}"]'); ok = False; padrow = None
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
                    if k == 'rhythm':
                        if force and rid == 'slow' and padrow is None: padrow = pg.evaluate(OVER)+1000*pg.evaluate(SMALL)
                        lab = pg.evaluate("RUN.steps[RUN.i].label"); adv(pg.evaluate("RUN.st.taps.length?(RUN.steps[RUN.i].lo<3?2.5:6):1")); woke('#run-pad'); pg.locator('[data-r="rhythm"]', has_text=lab).first.click(); continue
                    if k == 'pads':
                        if padrow is None: padrow = pg.evaluate(OVER)+1000*pg.evaluate(SMALL)
                        key = pg.evaluate("RUN.V.key"); st = pg.evaluate("({on:RUN.st.on,po:RUN.st.patchOff,sh:RUN.st.shaved})")
                        if key == 'patch' and not st['po']: lab = 'Peel off the patch, wipe the skin'
                        elif key == 'hair' and not st['sh']: lab = 'Shave the pad spots with the kit razor'
                        elif not st['on'].get('ru'): lab = 'Below his right collarbone'
                        else: lab = 'His left side, below the armpit'
                        adv(1); pg.locator('#run-box button', has_text=lab).first.click(); continue
                    if k == 'alt':
                        x = pg.evaluate("RUN.st.inCyc<5?'a':'b'"); adv(0.6); woke(f'[data-r="alt"][data-x="{x}"]'); pg.click(f'[data-r="alt"][data-x="{x}"]'); continue
                pg.wait_for_timeout(800)   # the score counts up for about 0.6 s; a person reads it once it settles
                score = pg.text_content('#done-s') if ok else '—'
                tag = rid + (' ' + force if force else '')
                rows.append((w, tag + ' (full)', 0 if ok and score == '100' else 99))
                if force: rows.append((w, tag + (' pads' if rid == 'pool' else ' breaths'), padrow if padrow is not None else 99))
                if force: rows.append((w, tag + ' result', pg.evaluate(OVER)+1000*pg.evaluate(SMALL)))
        pg.evaluate("localStorage.setItem('bls-ready',JSON.stringify({inst:true,runs:[]}))"); pg.goto(URL); pg.wait_for_timeout(200); pg.click('[data-run="tempo"]'); pg.wait_for_timeout(300); pg.click('#inst-fab'); pg.wait_for_timeout(200); rows.append((w, 'instructor', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)))); pg.click('#inst-close'); pg.evaluate("localStorage.removeItem('bls-ready')")
        pg.goto(URL+'?drill=special'); pg.wait_for_timeout(300); rows.append((w, 'daily link', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)) + (0 if pg.is_visible('#quizov') else 99)))
        pg.goto(URL); pg.wait_for_timeout(150); pg.click('#h-exam'); pg.wait_for_timeout(150); rows.append((w, 'exam', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL))))
        pg.close()
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(300)
    if pg.is_visible('#b-start'): pg.click('#b-start'); pg.wait_for_timeout(200)
    rows.append((844, 'landscape', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL))))
    pg.evaluate("localStorage.setItem('preconnect-settings',JSON.stringify({contrast:'day'}))"); pg.goto(URL); pg.wait_for_timeout(300)
    if pg.is_visible('#b-start'): pg.click('#b-start'); pg.wait_for_timeout(200)
    rows.append((844, 'daylight', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL))))
    pg.click('#h-set'); pg.wait_for_timeout(200)
    rows.append((844, 'settings land', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL))))
    pg.close()
    b.close()
for r in rows: print(f"{'PASS' if r[2] <= 1 else 'FAIL'}  {r[0]}px  {r[1]:<14} " + ("completed with real taps, score 100" if 'full' in r[1] and r[2] <= 1 else "DID NOT COMPLETE with real taps" if 'full' in r[1] else f"overflow {r[2]%1000}px · buttons under 44px: {r[2]//1000}"))
print('JavaScript errors:', errs or 'none')
sys.exit(1 if [r for r in rows if r[2] > 1] or errs else 0)
