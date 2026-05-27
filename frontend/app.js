function buildProfile() {
  return {
    age: parseInt(document.getElementById('age').value) || undefined,
    budget_max: parseFloat(document.getElementById('budget_max').value) || undefined,
    occasion: document.getElementById('occasion').value || undefined,
    style_preferences: document.getElementById('style_preferences').value.trim() || undefined,
    favorite_colors: document.getElementById('favorite_colors').value.trim() || undefined,
    avoid_colors: document.getElementById('avoid_colors').value.trim() || undefined,
  };
}

function renderCard(item) {
  return `
    <div class="card">
      <div class="card-top">
        <div>
          <div class="card-name">${item.name}</div>
          <div class="card-meta">
            <span class="card-price">$${item.price}</span>
            <span class="card-category">${item.category}</span>
          </div>
        </div>
        <span class="card-badge">Styled Pick</span>
      </div>
      <div class="card-reason">${item.reason}</div>
    </div>`;
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const resultsSection = document.getElementById('resultsSection');
  const cards = document.getElementById('cards');
  const errorMsg = document.getElementById('errorMsg');

  submitBtn.disabled = true;
  btnText.textContent = 'Finding your look...';
  btnLoader.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  errorMsg.classList.add('hidden');

  const profile = buildProfile();

  if (!profile.occasion) {
    errorMsg.textContent = '💡 Tip: selecting an occasion gives you much better results — but we\'ll try anyway!';
    errorMsg.classList.remove('hidden');
    errorMsg.style.background = '#fffbea';
    errorMsg.style.borderColor = '#f0d060';
    errorMsg.style.color = '#7a6000';
  }

  try {
    const res = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    const data = await res.json();

    if (!data.recommendations?.length) {
      errorMsg.textContent = 'No recommendations found. Try adjusting your preferences.';
      errorMsg.classList.remove('hidden');
      return;
    }

    cards.innerHTML = data.recommendations.map(renderCard).join('');
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    errorMsg.textContent = err.message.includes('fetch') 
      ? 'Could not connect to server. Make sure the backend is running.'
      : err.message;
    errorMsg.style.background = '';
    errorMsg.style.borderColor = '';
    errorMsg.style.color = '';
    errorMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Get Recommendations';
    btnLoader.classList.add('hidden');
  }
});
