require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { GoogleGenerativeAI } = require('@google/generative-ai');
const products = require('../../data/products.json');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse comma-separated free text into array of lowercase tokens
function parseTokens(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function scoreProduct(p, profile) {
    const styleTokens = parseTokens(profile.style_preferences);
    const colorTokens = parseTokens(profile.favorite_colors);
    const occasion = profile.occasion ?? '';

    const occasionScore = occasion && p.occasions.includes(occasion) ? 1 : 0;

    const styleScore = styleTokens.length
        ? p.style_tags.filter(t => styleTokens.some(s => t.includes(s) || s.includes(t))).length / styleTokens.length
        : 0.5; // neutral if not specified

    const colorScore = colorTokens.length
        ? p.colors.filter(c => colorTokens.some(s => c.includes(s) || s.includes(c))).length / colorTokens.length
        : 0.5; // neutral if not specified

    const WEIGHTS = occasion ? { occasion: 0.4, style: 0.35, color: 0.25 } : { occasion: 0, style: 0.55, color: 0.45 };
    return (occasionScore * WEIGHTS.occasion) + (styleScore * WEIGHTS.style) + (colorScore * WEIGHTS.color);
}

function buildFallbackReason(p, profile) {
    const parts = [];
    const occasion = profile.occasion ?? '';
    if (occasion && p.occasions.includes(occasion)) parts.push(`great for ${occasion}`);
    parts.push(`a ${p.style_tags.slice(0, 2).join(' & ')} piece`);
    if (p.colors.length) parts.push(`available in ${p.colors.slice(0, 2).join(' & ')}`);
    return parts.join(', ').replace(/^./, s => s.toUpperCase()) + '.';
}

async function getAiReasons(topProducts, profile) {
    const profileSummary = [
        profile.age && `Age: ${profile.age}`,
        profile.budget_max && `Budget: up to $${profile.budget_max}`,
        profile.occasion && `Occasion: ${profile.occasion}`,
        profile.style_preferences && `Style preferences: ${profile.style_preferences}`,
        profile.favorite_colors && `Favorite colors: ${profile.favorite_colors}`,
        profile.avoid_colors && `Colors to avoid: ${profile.avoid_colors}`,
    ].filter(Boolean).join('\n');

    const prompt = `You are a personal stylist. Based on this user profile, choose the 5 most suitable items from the list and write a unique 1-2 sentence reason for each that feels personal and specific to this user.

User profile:
${profileSummary}

Items:
${JSON.stringify(topProducts.map(p => ({ product_id: p.product_id, name: p.name, style_tags: p.style_tags, occasions: p.occasions, colors: p.colors, price: p.price })), null, 2)}

IMPORTANT: If an occasion is specified in the user profile, only pick items whose occasions list includes that occasion.
Respond ONLY with a valid JSON array:
[{ "product_id": "p_001", "reason": "..." }, ...]
Pick exactly ${Math.min(5, topProducts.length)} items. Each reason must be different and specific.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(text);
    return parsed
        .map(({ product_id, reason }) => {
            const product = topProducts.find(p => p.product_id === product_id);
            return product ? { ...product, reason } : null;
        })
        .filter(Boolean);
}

exports.generateRecommendations = async (userProfile) => {
    const budget = userProfile.budget_max ?? Infinity;
    const avoidTokens = parseTokens(userProfile.avoid_colors);

    const filtered = products.filter(p =>
        p.price <= budget &&
        !p.colors.some(c => avoidTokens.some(a => c.includes(a) || a.includes(c)))
    );

    if (filtered.length === 0) return [];

    const occasion = userProfile.occasion;
    const scored = filtered
        .map(p => ({ ...p, score: scoreProduct(p, userProfile) }))
        .sort((a, b) => b.score - a.score);

    const top10 = (occasion
        ? scored.filter(p => p.occasions.includes(occasion))
        : scored
    ).slice(0, 10).map(({ score, ...rest }) => rest);

    try {
        return await getAiReasons(top10, userProfile);
    } catch (err) {
        console.warn('AI unavailable, using fallback:', err.message);
        return top10.slice(0, 5).map(p => ({ ...p, reason: buildFallbackReason(p, userProfile) }));
    }
};
