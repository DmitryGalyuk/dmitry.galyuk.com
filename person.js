// Fetch person data from contacts.json and update index.html tags
async function updatePersonData() {
	const hostname = 'elena.galyuk.com'// window.location.hostname.replace(/^www\./, '');

	try {
		const response = await fetch('contacts.json');
		const data = await response.json();
		const person = data[hostname];
		if (!person) return;

		// Name
		const nameLabel = document.getElementById('name-label');
		if (nameLabel) nameLabel.textContent = person.name;

		// Photo
		const avatar = document.querySelector('.avatar');
		if (avatar && person.photo) avatar.src = 'persons/' + person.photo;

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

		// Meta tags (title)
		if (person.meta && person.meta.title) {
			document.title = person.meta.title;
		}
	} catch (e) {
		console.error('Failed to load person data:', e);
	}
}

document.addEventListener('DOMContentLoaded', updatePersonData);
