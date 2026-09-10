"""Local browser smoke tests. Requires Python 3 + playwright and a running Vite server.
Run: python3 tests/browser_smoke.py
No real AI requests are sent; connected-AI UI is tested with mocked responses.
"""
import os
from playwright.sync_api import sync_playwright

URL = os.environ.get('APP_URL', 'http://127.0.0.1:5173')


def open_app(browser, width=1280):
    page = browser.new_page(viewport={'width': width, 'height': 900})
    page.goto(URL, wait_until='networkidle')
    page.locator('.modal-close').click()
    return page


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [320, 375, 768, 1024, 1440]:
        page = open_app(browser, width)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        nav = '.side-nav' if width > 860 else '.mobile-nav'
        for index in range(4):
            page.locator(nav + ' button').nth(index).click()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, index)
        assert not errors, errors
        page.close()
    print('PASS: four views at five viewport sizes')

    page = open_app(browser)
    page.locator('.daily-slot-card.core button').click()
    state = page.evaluate("JSON.parse(localStorage.getItem('satzgarten-progress-v2'))")
    assert not state['completedDailySlotIds'] and state['leaves'] == 0
    page.get_by_role('tab', name='Üben 3').click()
    for choice in ['A heiße', 'B kommst']:
        page.get_by_role('button', name=choice, exact=True).click()
        page.get_by_role('button', name='Prüfen', exact=True).click()
        page.get_by_role('button', name='Glasklar Sofort gesehen').click()
        assert page.locator('.confidence-pill:disabled').count() == 3
        page.get_by_role('button', name='Nächste Aufgabe').click()
    for token in ['Heute', 'lerne', 'ich', 'Deutsch']:
        page.locator('.token-pool').get_by_role('button', name=token, exact=True).click()
    page.get_by_role('button', name='Prüfen', exact=True).click()
    page.get_by_role('button', name='Glasklar Sofort gesehen').click()
    page.get_by_role('button', name='Ergebnis', exact=True).click()
    assert page.locator('.practice-finish').is_visible(), 'Result must survive completion state changes'
    state = page.evaluate("JSON.parse(localStorage.getItem('satzgarten-progress-v2'))")
    assert state['practiceAnswered'] == 3 and state['streak'] == 1
    assert state['completedDailySlotIds'] == ['slot-core']
    assert state['unitStats']['hallo-verbmotor']['attempts'] == 3
    page.reload(wait_until='networkidle')
    page.locator('.modal-close').click()
    assert page.evaluate("JSON.parse(localStorage.getItem('satzgarten-progress-v2')).practiceAnswered") == 3
    print('PASS: answers, confidence, completion rewards, result screen and persistence')

    page.locator('.side-nav button').nth(2).click()
    page.locator('.article-game-card').click()
    nouns = {'Apfel': '🍎', 'Banane': '🍌', 'Brot': '🍞', 'Tisch': '🪑', 'Lampe': '💡', 'Fenster': '🪟', 'Bahnhof': '🚉', 'Apotheke': '⚕️', 'Handy': '📱'}
    seen = set()
    for index in range(6):
        noun = page.locator('.noun-stage h2').inner_text().removeprefix('___ ')
        assert noun in nouns and noun not in seen, f'Stale or incorrect noun: {noun}'
        assert page.locator('.noun-emoji').inner_text() == nouns[noun]
        assert page.locator('.game-progress > span').inner_text() == f'{index + 1}/6'
        assert page.locator('.game-board').get_attribute('translate') == 'no'
        assert page.locator('.article-option > span').all_text_contents() == ['der', 'die', 'das']
        seen.add(noun)
        if index == 0:
            # Simulate a translator replacing React-owned text nodes with its own markup.
            page.locator('.noun-stage h2').evaluate("e => { e.innerHTML = '<font>___ Bread</font>' }")
            page.locator('.game-progress > span').evaluate("e => { e.innerHTML = '<font>1/6</font>' }")
        page.locator('.article-option').first.click()
        page.locator('.game-feedback button').click()
    assert page.locator('.game-result').is_visible()
    page.get_by_role('button', name='Noch eine Runde').click()
    assert page.locator('.noun-stage').is_visible()
    print('PASS: article round completion and replay, including translated-DOM recovery')
    page.locator('.side-nav button').nth(1).click()
    page.locator('.unit-card button').nth(2).click()
    page.get_by_role('tab', name='Üben 3').click()
    assert page.locator('.question-area').get_attribute('translate') == 'no'
    assert page.locator('.question-prompt h3').inner_text() == 'Ich kaufe ___ Apfel.'
    assert page.locator('.choice-option strong').all_text_contents() == ['ein', 'einen', 'eine']
    page.get_by_role('button', name='B einen', exact=True).click()
    page.get_by_role('button', name='Prüfen', exact=True).click()
    assert page.locator('.answer-feedback.correct').is_visible()
    print('PASS: German accusative sentence and distinct article options')
    page.close()

    page = open_app(browser)
    page.route('**/api/tutor/status', lambda route: route.fulfill(json={'available': True, 'model': 'mock-model'}))
    requests = []
    def tutor_mock(route):
        requests.append(route.request.post_data_json)
        route.fulfill(json={'answer': '[Ich] [sehe] [den Apfel]. The object uses den.', 'model': 'mock-model'})
    page.route('**/api/tutor', tutor_mock)
    page.get_by_role('button', name='Weiterlernen').click()
    page.get_by_role('tab', name='Beispiele', exact=True).click()
    page.wait_for_function("document.querySelector('.tutor-status').textContent === 'mock-model'")
    ask = page.get_by_role('button', name='Explain more simply')
    assert ask.is_disabled()
    page.locator('.tutor-consent input').check()
    page.locator('#tutor-question').fill('Why den?')
    ask.click()
    page.locator('.tutor-answer').wait_for()
    assert len(requests) == 1 and 'name' not in requests[0]
    assert requests[0]['question'] == 'Why den?'
    print('PASS: optional AI consent, minimal context and answer rendering (mocked)')
    page.close()
    browser.close()
