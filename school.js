// Function to get a flat list of articles in TOC order
function getFlatArticleList() {
    const flatList = [];
    
    function traverse(ul) {
        const items = ul.children;
        for (const item of items) {
            const link = item.querySelector(':scope > a');
            if (link) {
                const articleId = link.getAttribute('href').substring(1);
                flatList.push(articleId);
            }
            const subList = item.querySelector(':scope > ul');
            if (subList) {
                traverse(subList);
            }
        }
    }

    const mainList = document.querySelector('.toc > ul');
    if (mainList) {
        traverse(mainList);
    }
    return flatList;
}

// Function to add "Next Article" links
function addNextArticleLinks() {
    const articleList = getFlatArticleList();
    
    articleList.forEach((articleId, index) => {
        const article = document.getElementById(articleId);
        if (article && index < articleList.length - 1) {
            const nextArticleId = articleList[index + 1];
            const nextArticle = document.getElementById(nextArticleId);
            if (nextArticle) {
                const nextLink = document.createElement('a');
                nextLink.href = '#' + nextArticleId;
                nextLink.className = 'next-article';
                nextLink.textContent = 'Next: ' + nextArticle.querySelector('h1').textContent;
                article.appendChild(nextLink);
            }
        }
    });
}

// Function to update active state in TOC
function updateActiveTOCItem() {
    // Remove active class from all links
    document.querySelectorAll('.toc a').forEach(link => {
        link.classList.remove('active');
    });

    // Get the current hash
    const hash = window.location.hash;
    
    if (hash) {
        // Find and highlight the corresponding TOC link
        const activeLink = document.querySelector(`.toc a[href="${hash}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    } else {
        // If no hash, highlight the first article's link
        const firstLink = document.querySelector('.toc a');
        if (firstLink) {
            firstLink.classList.add('active');
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
        articleMap.set(article.id, {
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
                const childId = link.getAttribute('href').substring(1); // Remove #
                if (articleMap.has(childId)) {
                    articleMap.get(article.id).children.push(childId);
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
        link.href = '#' + articleId;
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
document.addEventListener('DOMContentLoaded', generateTOC);

// Update active state when hash changes
window.addEventListener('hashchange', updateActiveTOCItem);
