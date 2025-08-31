// Fetch person data from contacts.json and update index.html tags
async function updatePersonData() {
	const hostname = (window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes(".local")) ? 'dmitry.galyuk.com' : window.location.hostname;
	const pathname = window.location.pathname;
	const lang = pathname.startsWith('/en') ? 'en' : 'ru';

	try {
		const response = await fetch('contacts.json');
		const data = await response.json();
		const person = data.find(p => p.domain === hostname);
		if (!person) throw new Error('Person not found for domain: ' + hostname);
		const translation = person[lang];
		if (!translation) throw new Error('Translation not found for lang: ' + lang);

		// Name
		const nameLabel = document.getElementById('name-label');
		if (nameLabel && translation.name) nameLabel.textContent = translation.name;

		// Profession
		const professionLabel = document.getElementById('profession-label');
		if (professionLabel) {
			professionLabel.textContent = translation.profession || '';
			professionLabel.style.display = translation.profession ? '' : 'none';
		}

		// Photo
		const avatar = document.querySelector('.avatar');
		if (avatar && person.photo) avatar.src = person.photo.startsWith('http') ? person.photo : 'persons/' + person.photo;

		// Services
		const servicesList = document.querySelector('.services');
		if (servicesList && Array.isArray(translation.services)) {
			servicesList.innerHTML = '';
			translation.services.forEach(service => {
				const li = document.createElement('li');
				li.textContent = service;
				servicesList.appendChild(li);
			});
		}

		// Contacts
		const contactItems = document.querySelectorAll('.contact-item');
		if (contactItems.length >= 2 && translation.contacts) {
			// Phone
			const phoneLink = contactItems[0].querySelector('.contact-link');
			if (phoneLink) {
				phoneLink.textContent = translation.contacts.phone;
				phoneLink.href = 'tel:' + translation.contacts.phone.replace(/\s+/g, '');
			}
			// Email
			const emailLink = contactItems[1].querySelector('.contact-link');
			if (emailLink) {
				emailLink.textContent = translation.contacts.email;
				emailLink.href = 'mailto:' + translation.contacts.email;
			}
		}

		// Socials
		if (translation.socials) {
			const socialLinks = document.querySelectorAll('.social');
			socialLinks.forEach(link => {
				// Find key by class name, e.g. 'telegram-link' => 'telegram'
				const classMatch = Array.from(link.classList).find(cls => cls.endsWith('-link'));
				let key = classMatch ? classMatch.replace('-link', '') : '';
				if (translation.socials[key]) {
					link.href = translation.socials[key];
					link.style.display = '';
				} else {
					link.style.display = 'none';
				}
			});
		}

		// SEO meta tags (always use person photo for images and favicon)
		if (translation.meta) {
			if (translation.meta.title) document.title = translation.meta.title;
			const setMeta = (selector, value) => {
				const el = document.querySelector(selector);
				if (el && value) el.setAttribute('content', value);
			};
			setMeta('meta[name="description"]', translation.meta.description);
			setMeta('meta[name="keywords"]', translation.meta.keywords);
			setMeta('meta[name="author"]', translation.meta.author);
			setMeta('meta[property="og:title"]', translation.meta['og:title'] || translation.meta.title);
			setMeta('meta[property="og:description"]', translation.meta['og:description'] || translation.meta.description);
			const photoPath = person.photo ? (person.photo.startsWith('http') ? person.photo : 'persons/' + person.photo) : '';
			setMeta('meta[property="og:image"]', photoPath);
			setMeta('meta[name="twitter:image"]', photoPath);
			// Favicon
			const iconEl = document.querySelector('link[rel="icon"]');
			if (iconEl && photoPath) iconEl.href = photoPath;
			setMeta('meta[property="og:url"]', translation.meta['og:url']);
			setMeta('meta[name="twitter:card"]', translation.meta['twitter:card']);
			setMeta('meta[name="twitter:title"]', translation.meta['twitter:title'] || translation.meta.title);
			setMeta('meta[name="twitter:description"]', translation.meta['twitter:description'] || translation.meta.description);
			// Also update <title> tag text
			const titleEl = document.getElementById('page-title');
			if (titleEl && translation.meta.title) titleEl.textContent = translation.meta.title;
		}
	} catch (e) {
		console.error('Failed to load person data:', e);
	}
}

document.addEventListener('DOMContentLoaded', updatePersonData);
