const recommendationService = require('../src/services/recommendationService');

async function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${testName}`);
            failed++;
        }
    }

    // Test 1 — returns between 1 and 5 results
    const profile = {
        budget_max: 300,
        avoid_colors: 'neon_yellow',
        style_preferences: 'minimalist',
        favorite_colors: 'black, beige',
        occasion: 'work_from_home'
    };
    const results = await recommendationService.generateRecommendations(profile);
    assert(results.length >= 1 && results.length <= 5, 'Returns between 1 and 5 recommendations');

    // Test 2 — no result exceeds budget
    assert(results.every(p => p.price <= profile.budget_max), 'All results are within budget');

    // Test 3 — no result contains avoided color
    assert(results.every(p => !p.colors.includes('neon_yellow')), 'No results contain avoided colors');

    // Test 4 — every result has a reason string
    assert(results.every(p => typeof p.reason === 'string' && p.reason.length > 0), 'Every result has a reason');

    // Test 5 — partial profile (missing most fields) does not crash
    const partialResults = await recommendationService.generateRecommendations({ occasion: 'weekend' });
    assert(Array.isArray(partialResults), 'Handles partial profile without crashing');

    // Test 6 — completely empty profile does not crash
    const emptyResults = await recommendationService.generateRecommendations({});
    assert(Array.isArray(emptyResults), 'Handles completely empty profile without crashing');

    // Test 7 — budget too low returns empty array
    const noResults = await recommendationService.generateRecommendations({ budget_max: 1 });
    assert(noResults.length === 0, 'Returns empty array when budget is too low');

    console.log(`\n${passed} passed, ${failed} failed`);
}

runTests();
