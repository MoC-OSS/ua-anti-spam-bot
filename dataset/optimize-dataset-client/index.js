/* eslint-disable no-undef */
const optimizeListEl = document.querySelector('[data-optimize-list]');
const optimizeItemTemplateEl = document.querySelector('[data-optimize-item-template]');
const caseTemplateEl = document.querySelector('[data-case-template]');

function createCase(caseItem, type, callback) {
  const positiveCaseEl = caseTemplateEl.content.cloneNode(true);
  const positiveCaseBodyEl = positiveCaseEl.querySelector('[data-body]');
  const positiveCaseMessageEl = positiveCaseEl.querySelector('[data-message]');
  const positiveCaseRemoveBtnEl = positiveCaseEl.querySelector('[data-remove-btn]');

  positiveCaseBodyEl.classList.add(type);
  positiveCaseMessageEl.innerText = caseItem.value;
  positiveCaseRemoveBtnEl.addEventListener('click', () => callback(positiveCaseBodyEl));

  return positiveCaseEl;
}

function handleDelete(path, type, el, index, negativeIndex) {
  axios.post('http://localhost:3050/remove', { range: path, index, negativeIndex, type }).then(() => {
    el.remove();
  });
}

axios.get('http://localhost:3050/optimize').then((response) => {
  const optimizeCases = response.data;
  console.info(optimizeCases);

  optimizeCases.forEach((optimize, index) => {
    if (optimize.resolved) {
      return;
    }

    const optimizeItemEl = optimizeItemTemplateEl.content.cloneNode(true);
    const optimizeItemPositivesEl = optimizeItemEl.querySelector('[data-positives]');
    const optimizeItemNegativesEl = optimizeItemEl.querySelector('[data-negatives]');
    const optimizeItemRemoveEl = optimizeItemEl.querySelector('[data-remove]');

    if (!optimize.positive.resolved) {
      const positiveCaseEl = createCase(optimize.positive, 'positive', (element) => {
        console.info('Remove', optimize.positive.fullPath);
        handleDelete(optimize.positive.fullPath, 'positive', element, index, -1);
      });

      optimizeItemPositivesEl.appendChild(positiveCaseEl);
    }

    optimize.negativesMatch
      .filter((negative) => !negative.resolved)
      .forEach((negative, negativeIndex) => {
        const negativeCaseEl = createCase(negative, 'negative', (element) => {
          console.info('Remove', negative.fullPath);
          handleDelete(negative.fullPath, 'negative', element, index, negativeIndex);
        });

        optimizeItemNegativesEl.appendChild(negativeCaseEl);
      });

    optimizeItemRemoveEl.addEventListener('click', () => {
      handleDelete('', 'full', optimizeItemRemoveEl.parentElement, index, -1);
    });

    optimizeListEl.appendChild(optimizeItemEl);
  });
});
