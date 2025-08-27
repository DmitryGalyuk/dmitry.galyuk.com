document.addEventListener("DOMContentLoaded", main);

async function main() {

      const host = window.location.hostname;
    // en.galyuk.com for English, galyuk.com for Russian
    const lang = (/^en\./.test(host)) ? 'en' : 'ru';
    

    const galleryData = await loadGalleryData();
    renderFilterButtons(galleryData, lang);
    renderGalleryItems(galleryData.results, lang);


    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Trigger hash handling on page load
    handleHashChange();

    // Create a dialog element for the big picture or video
    const dialog = document.createElement("dialog");
    dialog.classList.add("image-dialog");
    document.body.appendChild(dialog);
}

function loadGalleryData() {
    return fetch('data.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error loading gallery data:', error);
            return [];
        });
}

function renderFilterButtons(galleryData, lang) {
    const filterContainer = document.querySelector(".gallery .filter");
    filterContainer.innerHTML = ''; // Clear existing buttons  

    // Create "All" button
    const allButton = document.createElement("button");
    allButton.className = "filter-button active";
    allButton.setAttribute("data-filter", "all");
    allButton.textContent = (lang === "ru" ? "все" : "all");
    filterContainer.appendChild(allButton);

    // Create buttons for each tag
    galleryData.tags.forEach(tag => {
        const button = document.createElement("button");
        button.className = "filter-button";
        button.setAttribute("data-filter", tag.tag);
        button.textContent = tag[lang];
        filterContainer.appendChild(button);

        button.addEventListener("pointerup", () => {
            const filter = button.getAttribute("data-filter");
            handleFiltering(filter); // Apply the filter when the button is clicked
        });
    });

}

// Function to close the dialog
function closeDialog() {
    const dialog = document.querySelector(".image-dialog");
    if (dialog.open) {
        dialog.close();

        // Remove iframe to unload the video
        const iframe = dialog.querySelector("iframe");
        if (iframe) {
            iframe.remove();
        }

        // Remove the hash from the URL
        history.pushState(null, "", location.pathname);

        // Detach the document pointerup handler
        document.removeEventListener("pointerup", closeDialog);
    }
};

// Function to open the dialog
function openDialog(content, hash, caption = "") {
    const dialog = document.querySelector(".image-dialog");
    // Clear the dialog content before opening it
    while (dialog.firstChild) {
        dialog.firstChild.remove();
    }

    // Create a wrapper for the content and caption
    const wrapper = document.createElement("div");
    wrapper.className = "dialog-content-wrapper";

    // Add the image or video
    wrapper.appendChild(content);

    // Add the caption if provided
    if (caption) {
        const captionElem = document.createElement("div");
        captionElem.className = "dialog-caption";
        captionElem.textContent = caption;
        wrapper.appendChild(captionElem);
    }

    dialog.appendChild(wrapper);
    dialog.showModal(); // Show the dialog as a modal

    // Update the URL hash
    history.pushState(null, "", `#${hash}`);

    // Attach the document pointerup handler to close the dialog
    document.addEventListener("pointerup", closeDialog);

    // also close the dialog with the Escape key
    dialog.addEventListener("cancel", closeDialog); // Close dialog on Escape key
};

// Function to handle filtering
function handleFiltering(filter) {
    const renderedItems = document.querySelectorAll(".gallery img, .gallery iframe"); // Select rendered images and videos
    renderedItems.forEach(item => {
        const tags = item.getAttribute("data-tag")?.split(" ") || [];
        const isMatch = filter === "all" || tags.includes(filter);

        // Toggle visibility based on the filter
        item.style.display = isMatch ? "inline-block" : "none";
    });

    // Update the active filter button
    const filterButtons = document.querySelectorAll(".filter-button");
    filterButtons.forEach(button => {
        button.classList.toggle("active", button.getAttribute("data-filter") === filter);
    });

    // Update the URL hash
    history.pushState(null, "", `#filter=${filter}`);
};

function renderGalleryItems(galleryData, lang) {

    const galleryContainer = document.querySelector(".gallery .cards");
    // Render gallery items
    galleryData.forEach(item => {
        const thumbnail = document.createElement("img");
        thumbnail.className = "gallery-item";
        
        const src = item["src"];
        const alt = item["alt-" + lang];
        const tag = item["tag"];
        const videoId = item["videoid"];

        thumbnail.alt = alt;
        thumbnail.title = alt; // <-- Add this line for tooltip
        if (videoId) {
            // Create img element for YouTube video thumbnail
            thumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; // YouTube thumbnail URL
            thumbnail.classList.add("gallery-video-thumbnail");
            thumbnail.setAttribute("data-tag", tag); // Preserve the tag for filtering

            // Add pointerup event to show the video in the dialog
            thumbnail.addEventListener("pointerup", (event) => {
                event.stopPropagation();
                const iframe = document.createElement("iframe");
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                iframe.title = alt;
                iframe.classList.add("gallery-video");
                iframe.setAttribute("frameborder", "0");
                iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
                iframe.setAttribute("allowfullscreen", "true");

                openDialog(iframe, `video=${videoId}`, alt);
            });

        } else if (src) {
            // Create img element for images
            thumbnail.src = `results/${src}`;
            thumbnail.classList.add("gallery-img");
            thumbnail.setAttribute("data-tag", tag);

            thumbnail.addEventListener("pointerup", (event) => {
                event.stopPropagation();
                const clonedImg = thumbnail.cloneNode(true);
                openDialog(clonedImg, `image=${src}`, alt);
            });

        
        }
        galleryContainer.appendChild(thumbnail);
    });
}

// Handle URL hash on page load or hash change
function handleHashChange() {
    const hash = location.hash.slice(1); // Remove the '#' from the hash
    if (hash.startsWith("filter=")) {
        const filter = hash.split("=")[1];
        handleFiltering(filter); // Apply the filter directly
    } else if (hash.startsWith("image=")) {
        const src = hash.split("=")[1];
        const img = document.querySelector(`img[src="${src}.jpeg"]`);
        if (img) {
            img.dispatchEvent(new PointerEvent("pointerup"));
        }
    } else if (hash.startsWith("video=")) {
        const videoId = hash.split("=")[1];
        const thumbnail = document.querySelector(`img[src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg"]`);
        if (thumbnail) {
            thumbnail.dispatchEvent(new PointerEvent("pointerup"));
        }
    } else {
        // Default to showing all items if no specific hash is present
        handleFiltering("all");
    }
};
