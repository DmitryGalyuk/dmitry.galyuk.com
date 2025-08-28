// Fetch person data from contacts.json and update index.html tags
async function updatePersonData() {
    const hostname = window.location.hostname.includes("127.0.0.1") ? 'dmitry.galyuk.com' : window.location.hostname;

	try {
        const response = await fetch('contacts.json');
		const data = await response.json();
		const person = data[hostname];
        
        // Name
		const nameLabel = document.getElementById('name-label');
		if (nameLabel && person.name) nameLabel.textContent = person.name;

		// Photo
		const avatar = document.querySelector('.avatar');
		if (avatar && person.photo) avatar.src = person.photo.startsWith('http') ? person.photo : 'persons/' + person.photo;

		// Services
		const servicesList = document.querySelector('.services');
		if (servicesList && Array.isArray(person.services)) {
			servicesList.innerHTML = '';
			person.services.forEach(service => {
				const li = document.createElement('li');
				li.textContent = service;
				servicesList.appendChild(li);
			});
		}
        
        // Contacts
		const contactItems = document.querySelectorAll('.contact-item');
		if (contactItems.length >= 2 && person.contacts) {
			// Phone
			const phoneLink = contactItems[0].querySelector('.contact-link');
			if (phoneLink) {
				phoneLink.textContent = person.contacts.phone;
				phoneLink.href = 'tel:' + person.contacts.phone.replace(/\s+/g, '');
			}
			// Email
			const emailLink = contactItems[1].querySelector('.contact-link');
			if (emailLink) {
				emailLink.textContent = person.contacts.email;
				emailLink.href = 'mailto:' + person.contacts.email;
			}
		}

		// Socials
		if (person.socials) {
			const socialLinks = document.querySelectorAll('.social');
			socialLinks.forEach(link => {
				// Find key by class name, e.g. 'telegram-link' => 'telegram'
				const classMatch = Array.from(link.classList).find(cls => cls.endsWith('-link'));
				let key = classMatch ? classMatch.replace('-link', '') : '';
				if (person.socials[key]) {
					link.href = person.socials[key];
					link.style.display = '';
				} else {
					link.style.display = 'none';
				}
			});
		}

		// SEO meta tags (always use person photo for images and favicon)
		if (person.meta) {
			if (person.meta.title) document.title = person.meta.title;
			const setMeta = (selector, value) => {
				const el = document.querySelector(selector);
				if (el && value) el.setAttribute('content', value);
			};
			setMeta('meta[name="description"]', person.meta.description);
			setMeta('meta[name="keywords"]', person.meta.keywords);
			setMeta('meta[name="author"]', person.meta.author);
			setMeta('meta[property="og:title"]', person.meta['og:title'] || person.meta.title);
			setMeta('meta[property="og:description"]', person.meta['og:description'] || person.meta.description);
			const photoPath = person.photo ? (person.photo.startsWith('http') ? person.photo : 'persons/' + person.photo) : '';
			setMeta('meta[property="og:image"]', photoPath);
			setMeta('meta[name="twitter:image"]', photoPath);
			// Favicon
			const iconEl = document.querySelector('link[rel="icon"]');
			if (iconEl && photoPath) iconEl.href = photoPath;
			setMeta('meta[property="og:url"]', person.meta['og:url']);
			setMeta('meta[name="twitter:card"]', person.meta['twitter:card']);
			setMeta('meta[name="twitter:title"]', person.meta['twitter:title'] || person.meta.title);
			setMeta('meta[name="twitter:description"]', person.meta['twitter:description'] || person.meta.description);
			// Also update <title> tag text
			const titleEl = document.getElementById('page-title');
			if (titleEl && person.meta.title) titleEl.textContent = person.meta.title;
		}
	} catch (e) {
		console.error('Failed to load person data:', e);
	}
}

document.addEventListener('DOMContentLoaded', updatePersonData);
