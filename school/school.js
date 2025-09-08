// Function to build ordered list of articles based on hierarchy
function getOrderedArticleList() {
    const orderedList = [];
    const articleMap = new Map();
    const allArticles = document.querySelectorAll('main article');
    
    // First pass: create map entries for all articles
    allArticles.forEach(article => {
        articleMap.set(article.dataset.id, {
            element: article,
            children: [],
            isChild: false
        });
    });

    // Second pass: establish parent-child relationships
    allArticles.forEach(article => {
        const subTopics = article.querySelector('.sub-topics');
        if (subTopics) {
            const links = subTopics.querySelectorAll('a');
            links.forEach(link => {
                const childId = link.getAttribute('href').replace('/school/', '');
                if (articleMap.has(childId)) {
                    articleMap.get(article.dataset.id).children.push(childId);
                    articleMap.get(childId).isChild = true;
                }
            });
        }
    });

    // Build ordered list by traversing hierarchy
    function addToList(articleId) {
        orderedList.push(articleId);
        const article = articleMap.get(articleId);
        article.children.forEach(childId => {
            addToList(childId);
        });
    }

    // Start with root articles
    const rootArticles = Array.from(articleMap.entries())
        .filter(([_, data]) => !data.isChild)
        .map(([id, _]) => id);

    rootArticles.forEach(articleId => {
        addToList(articleId);
    });

    return orderedList;
}

// Function to add "Next Article" links
function addNextArticleLinks() {
    const articleList = getOrderedArticleList();
    
    articleList.forEach((articleId, index) => {
        const article = document.querySelector(`article[data-id="${articleId}"]`);
        if (article && index < articleList.length - 1) {
            const nextArticleId = articleList[index + 1];
            const nextArticle = document.querySelector(`article[data-id="${nextArticleId}"]`);
            if (nextArticle) {
                const nextLink = document.createElement('a');
                nextLink.href = `/school/${nextArticleId}`;
                nextLink.className = 'next-article';
                nextLink.textContent = 'Next: ' + nextArticle.querySelector('h1').textContent;
                article.appendChild(nextLink);
            }
        }
    });
}

// Function to update active state in TOC and page title
function updateActiveTOCItem() {
    // Remove active class from all links
    document.querySelectorAll('.toc a').forEach(link => {
        link.classList.remove('active');
    });

    // Get the current path
    const path = window.location.pathname;
    let articleId = path.replace('/school/', '');
    
    // Handle root path
    if (path === '/school' || path === '/school/') {
        articleId = 'intro';
    }
    
    // Update page title and visibility based on current article
    let currentArticle = null;
    document.querySelectorAll('article').forEach(article => {
        if (article.dataset.id === articleId) {
            article.style.display = 'block';
            currentArticle = article;
        } else {
            article.style.display = 'none';
        }
    });

    // Update page title and active link
    if (currentArticle) {
        const articleTitle = currentArticle.querySelector('h1').textContent;
        document.title = `${articleTitle} - School Articles`;
        const activeLink = document.querySelector(`.toc a[href="/school/${currentArticle.dataset.id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    } else {
        // If no article is found or invalid ID, show intro
        const introArticle = document.querySelector('article[data-id="intro"]');
        if (introArticle) {
            introArticle.style.display = 'block';
            document.title = `${introArticle.querySelector('h1').textContent} - School Articles`;
            const firstLink = document.querySelector(`.toc a[href="/school/intro"]`);
            if (firstLink) {
                firstLink.classList.add('active');
            }
        }
    }
}

// Function to recursively generate TOC from articles
function generateTOC() {
    const nav = document.querySelector('.toc');
    const mainList = document.createElement('ul');
    nav.appendChild(mainList);

    // Build a map of article relationships
    const articleMap = new Map();
    const allArticles = document.querySelectorAll('main article');
    
    // First pass: create map entries for all articles
    allArticles.forEach(article => {
        articleMap.set(article.dataset.id, {
            element: article,
            children: [],
            isChild: false
        });
    });

    // Second pass: establish parent-child relationships
    allArticles.forEach(article => {
        const subTopics = article.querySelector('.sub-topics');
        if (subTopics) {
            const links = subTopics.querySelectorAll('a');
            links.forEach(link => {
                const childId = link.getAttribute('href').replace('/school/', '');
                if (articleMap.has(childId)) {
                    articleMap.get(article.dataset.id).children.push(childId);
                    articleMap.get(childId).isChild = true;
                }
            });
        }
    });

    function createTOCItem(articleId) {
        const article = articleMap.get(articleId);
        if (!article) return null;

        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/school/${articleId}`;
        link.textContent = article.element.querySelector('h1').textContent;
        li.appendChild(link);

        if (article.children.length > 0) {
            const subList = document.createElement('ul');
            article.children.forEach(childId => {
                const childItem = createTOCItem(childId);
                if (childItem) {
                    subList.appendChild(childItem);
                }
            });
            li.appendChild(subList);
        }

        return li;
    }

    // Find root articles (those that aren't children of any other article)
    const rootArticles = Array.from(articleMap.entries())
        .filter(([_, data]) => !data.isChild)
        .map(([id, _]) => id);

    // Create TOC structure
    rootArticles.forEach(articleId => {
        const tocItem = createTOCItem(articleId);
        if (tocItem) {
            mainList.appendChild(tocItem);
        }
    });

    // Update active state initially
    updateActiveTOCItem();
    // Add next article links after TOC is generated
    addNextArticleLinks();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    generateTOC();
});

// Handle initial load
window.addEventListener('load', updateActiveTOCItem);
