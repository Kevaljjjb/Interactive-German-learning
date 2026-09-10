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
    page.locator('.daily-slot-card.play button').click()
    assert '#/practice/articles' in page.url, 'Daily game should have a reload-safe direct route'
    page.close()
    print('PASS: daily game opens its bookmarkable game route')

    page = open_app(browser)
    page.locator('.daily-slot-card.core button').click()
    state = page.evaluate("JSON.parse(localStorage.getItem('satzgarten-progress-v2'))")
    assert not state['completedDailySlotIds'] and state['leaves'] == 0
    page.get_by_role('tab', name='Practice 3').click()
    for choice in ['A heiße', 'B kommst']:
        page.get_by_role('button', name=choice, exact=True).click()
        page.get_by_role('button', name='Check', exact=True).click()
        page.get_by_role('button', name='Crystal clear Spotted right away').click()
        assert page.locator('.confidence-pill:disabled').count() == 3
        page.get_by_role('button', name='Next exercise').click()
    for token in ['Heute', 'lerne', 'ich', 'Deutsch']:
        page.locator('.token-pool').get_by_role('button', name=token, exact=True).click()
    page.get_by_role('button', name='Check', exact=True).click()
    page.get_by_role('button', name='Crystal clear Spotted right away').click()
    page.get_by_role('button', name='See results', exact=True).click()
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
        assert page.locator('.noun-stage h2').get_attribute('translate') == 'no'
        assert page.locator('.article-option > span').all_text_contents() == ['der', 'die', 'das']
        seen.add(noun)
        if index == 0:
            # Simulate a translator replacing React-owned text nodes with its own markup.
            page.locator('.noun-stage h2').evaluate("e => { e.innerHTML = '<font>___ Bread</font>' }")
            page.locator('.game-progress > span').evaluate("e => { e.innerHTML = '<font>1/6</font>' }")
        page.locator('.article-option').first.click()
        page.locator('.game-feedback button').click()
    assert page.locator('.game-result').is_visible()
    assert page.evaluate("JSON.parse(localStorage.getItem('satzgarten-progress-v2')).completedDailySlotIds") == ['slot-core'], 'A casual game must not complete a daily slot'
    page.get_by_role('button', name='Play another round').click()
    assert page.locator('.noun-stage').is_visible()
    print('PASS: article round completion and replay, including translated-DOM recovery')
    page.locator('.side-nav button').nth(1).click()
    page.locator('.unit-card button').nth(2).click()
    page.get_by_role('tab', name='Practice 3').click()
    assert page.locator('.assembled-sentence').get_attribute('translate') == 'no'
    assert 'Ich kaufe' in page.locator('.assembled-sentence').inner_text() and '___' in page.locator('.assembled-sentence').inner_text()
    assert page.locator('.choice-option strong').all_text_contents() == ['ein', 'einen', 'eine']
    page.get_by_role('button', name='B einen', exact=True).click()
    page.get_by_role('button', name='Check', exact=True).click()
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
    page.get_by_role('button', name='Continue learning').click()
    page.get_by_role('tab', name='Examples', exact=True).click()
    page.wait_for_function("document.querySelector('.tutor-status').textContent.includes('mock-model')")
    ask = page.get_by_role('button', name='Explain more simply')
    assert ask.is_disabled()
    page.locator('.tutor-consent input').check()
    page.locator('#tutor-question').fill('Why den?')
    ask.click()
    page.locator('.tutor-answer').wait_for()
    assert len(requests) == 1 and 'name' not in requests[0]
    assert requests[0]['question'] == 'Why den?'
    print('PASS: optional lesson AI consent, minimal context and answer rendering (mocked)')
    page.close()

    page = open_app(browser)
    page.route('**/api/tutor/status', lambda route: route.fulfill(json={'available': True, 'provider': 'codex-cli', 'model': 'mock-codex'}))
    guide_requests = []
    def guide_mock(route):
        guide_requests.append(route.request.post_data_json)
        route.fulfill(json={'answer': 'Start with the direct object pattern.', 'model': 'mock-codex', 'recommendations': [{'unitId': 'essen-artikel', 'tab': 'discover', 'topic': 'Accusative', 'label': 'Der, Die, Das in the Basket', 'reason': 'Learn why der changes to den.'}]})
    page.route('**/api/guide', guide_mock)
    page.get_by_role('button', name='Ask the AI guide Find any grammar topic').click()
    page.locator('#guide-question').fill('Teach me accusative')
    assert page.locator('.guide-routes a').count() >= 1, 'Local direct links should appear before an AI request'
    page.locator('.guide-consent input').check()
    page.get_by_role('button', name='Ask AI and build my route').click()
    page.locator('.guide-answer').wait_for()
    link = page.locator('.guide-routes a').first
    assert '#/learn/essen-artikel/discover/accusative' in link.get_attribute('href')
    link.click()
    assert '#/learn/essen-artikel/discover/accusative' in page.url
    assert page.locator('.focused-topic').count() == 1
    assert page.get_by_role('tab', name='Accusative').get_attribute('aria-selected') == 'true'
    assert guide_requests[0] == {'question': 'Teach me accusative', 'completedUnitIds': []}
    page.get_by_role('button', name='Mix').click()
    assert 'Keep experimenting' in page.locator('.syntax-signal').inner_text()
    page.get_by_role('button', name='Reset').click()
    assert 'Pattern locked' in page.locator('.syntax-signal').inner_text()
    original_blocks = page.locator('.kinetic-block > span').all_text_contents()
    page.locator('.kinetic-block').first.click()
    page.locator('.kinetic-block').last.click()
    swapped_blocks = page.locator('.kinetic-block > span').all_text_contents()
    assert swapped_blocks[0] == original_blocks[-1] and swapped_blocks[-1] == original_blocks[0], 'Tap interaction must truly swap blocks'
    page.get_by_role('button', name='Reset').click()
    page.get_by_role('tab', name='Practice 3').click()
    assert '#/learn/essen-artikel/practice/accusative' in page.url
    page.get_by_role('button', name='B einen', exact=True).click()
    assert 'einen' in page.locator('.assembled-sentence').inner_text()
    page.get_by_role('button', name='Open AI learning guide').click()
    page.keyboard.press('Escape')
    assert page.locator('.ai-guide').count() == 0 and 'einen' in page.locator('.assembled-sentence').inner_text(), 'Modal shortcuts must not modify background practice'
    page.go_back()
    assert '#/learn/essen-artikel/discover/accusative' in page.url and page.locator('.kinetic-lab').is_visible()
    page.go_forward()
    assert '#/learn/essen-artikel/practice/accusative' in page.url and page.locator('.practice-session').is_visible()
    print('PASS: AI topic routing, browser history, topic focus, focus-safe modal and kinetic sentence lab')
    page.close()
    browser.close()
