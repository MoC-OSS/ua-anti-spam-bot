/* eslint-disable no-undef */
const optimizeListElement = document.querySelector('[data-optimize-list]');
const optimizeItemTemplateElement = document.querySelector('[data-optimize-item-template]');
const caseTemplateElement = document.querySelector('[data-case-template]');

function createCase(caseItem, type, callback) {
  const positiveCaseElement = caseTemplateElement.content.cloneNode(true);
  const positiveCaseBodyElement = positiveCaseElement.querySelector('[data-body]');
  const positiveCaseMessageElement = positiveCaseElement.querySelector('[data-message]');
  const positiveCaseRemoveButtonElement = positiveCaseElement.querySelector('[data-remove-btn]');

  positiveCaseBodyElement.classList.add(type);
  positiveCaseMessageElement.innerText = caseItem.value;
  positiveCaseRemoveButtonElement.addEventListener('click', () => callback(positiveCaseBodyElement));

  return positiveCaseElement;
}

function handleDelete(path, type, element, index, negativeIndex) {
  axios.post('http://localhost:3050/remove', { range: path, index, negativeIndex, type }).then(() => {
    element.remove();
  });
}

axios.get('http://localhost:3050/optimize').then((response) => {
  const optimizeCases = response.data;
  console.info(optimizeCases);

  optimizeCases.forEach((optimize, index) => {
    if (optimize.resolved) {
      return;
    }

    const optimizeItemElement = optimizeItemTemplateElement.content.cloneNode(true);
    const optimizeItemPositivesElement = optimizeItemElement.querySelector('[data-positives]');
    const optimizeItemNegativesElement = optimizeItemElement.querySelector('[data-negatives]');
    const optimizeItemRemoveElement = optimizeItemElement.querySelector('[data-remove]');

    if (!optimize.positive.resolved) {
      const positiveCaseElement = createCase(optimize.positive, 'positive', (element) => {
        console.info('Remove', optimize.positive.fullPath);
        handleDelete(optimize.positive.fullPath, 'positive', element, index, -1);
      });

      optimizeItemPositivesElement.append(positiveCaseElement);
    }

    optimize.negativesMatch
      .filter((negative) => !negative.resolved)
      .forEach((negative, negativeIndex) => {
        const negativeCaseElement = createCase(negative, 'negative', (element) => {
          console.info('Remove', negative.fullPath);
          handleDelete(negative.fullPath, 'negative', element, index, negativeIndex);
        });

        optimizeItemNegativesElement.append(negativeCaseElement);
      });

    optimizeItemRemoveElement.addEventListener('click', () => {
      handleDelete('', 'full', optimizeItemRemoveElement.parentElement, index, -1);
    });

    optimizeListElement.append(optimizeItemElement);
  });
});
