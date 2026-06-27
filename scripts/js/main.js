document.addEventListener('DOMContentLoaded', function(){
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    const quoteButtons = document.querySelectorAll('.open-quote-modal');
    const quoteModal = document.getElementById('quoteModal');
    const quoteForm = document.getElementById('quoteForm');
    const quoteOptions = document.getElementById('quoteOptions');
    const sendWhatsapp = document.getElementById('sendWhatsapp');
    const sendEmail = document.getElementById('sendEmail');
    const addressInput = document.getElementById('addressInput');
    const neighborhoodInput = document.getElementById('neighborhoodInput');
    const cityInput = document.getElementById('cityInput');
    const stateInput = document.getElementById('stateInput');
    const addressSuggestions = document.getElementById('addressSuggestions');
    const eventTypeSelect = document.getElementById('eventTypeSelect');
    const eventTypeOther = document.getElementById('eventTypeOther');
    const closeModalButtons = document.querySelectorAll('.modal-close, .close-options');
    let addressSearchTimer = null;

    if(navToggle && mainNav){
        navToggle.addEventListener('click', () => {
            const expanded = mainNav.style.display === 'flex';
            mainNav.style.display = expanded ? 'none' : 'flex';
        });

        mainNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                if(window.innerWidth <= 700){
                    mainNav.style.display = 'none';
                }
            });
        });
    }

    const updateOtherEventField = () => {
        if(eventTypeSelect && eventTypeOther){
            const isOther = eventTypeSelect.value === 'Outros';
            eventTypeOther.hidden = !isOther;
            if(!isOther){
                eventTypeOther.value = '';
            }
        }
    };

    const hideAddressSuggestions = () => {
        if(addressSuggestions){
            addressSuggestions.innerHTML = '';
            addressSuggestions.classList.remove('active');
        }
    };

    const openQuoteModal = () => {
        if(quoteModal){
            quoteModal.classList.add('active');
            quoteModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if(quoteForm){ quoteForm.style.display = ''; }
            if(quoteOptions){ quoteOptions.classList.add('hidden'); }
            updateOtherEventField();
        }
    };

    const closeQuoteModal = () => {
        if(quoteModal){
            quoteModal.classList.remove('active');
            quoteModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if(quoteOptions){ quoteOptions.classList.add('hidden'); }
            if(quoteForm){ quoteForm.reset(); }
            updateOtherEventField();
            hideAddressSuggestions();
        }
    };

    quoteButtons.forEach(button => button.addEventListener('click', openQuoteModal));
    closeModalButtons.forEach(button => button.addEventListener('click', closeQuoteModal));

    if(quoteModal){
        quoteModal.addEventListener('click', (e) => {
            if(e.target === quoteModal){ closeQuoteModal(); }
        });
    }

    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && quoteModal && quoteModal.classList.contains('active')){
            closeQuoteModal();
        }
    });

    const searchAddressSuggestions = async (query) => {
        if(!addressSuggestions || query.length < 3){
            hideAddressSuggestions();
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&q=${encodeURIComponent(query)}`, {
                headers: {'Accept-Language': 'pt-BR,pt;q=0.9'}
            });
            const results = await response.json();

            if(!results || !results.length){
                hideAddressSuggestions();
                return;
            }

            addressSuggestions.innerHTML = results.map(item => {
                const address = item.address || {};
                const street = address.road || address.pedestrian || address.residential || address.cycleway || address.footway || address.street || item.display_name.split(',')[0] || '';
                const neighborhood = address.neighbourhood || address.suburb || address.city_district || address.village || '';
                const city = address.city || address.town || address.village || address.county || '';
                const state = address.state || '';
                return `
                    <button type="button" class="address-suggestion"
                        data-street="${street.replace(/"/g, '&quot;')}"
                        data-neighborhood="${neighborhood.replace(/"/g, '&quot;')}"
                        data-city="${city.replace(/"/g, '&quot;')}"
                        data-state="${state.replace(/"/g, '&quot;')}">
                        ${item.display_name}
                    </button>
                `;
            }).join('');
            addressSuggestions.classList.add('active');
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
            hideAddressSuggestions();
        }
    };

    const handleAddressInput = () => {
        const value = addressInput.value.trim();
        if(!value || value.length < 3){
            hideAddressSuggestions();
            return;
        }

        if(addressSearchTimer){
            clearTimeout(addressSearchTimer);
        }
        addressSearchTimer = setTimeout(() => searchAddressSuggestions(value), 300);
    };

    if(addressInput){
        addressInput.setAttribute('autocomplete', 'off');
        addressInput.addEventListener('input', handleAddressInput);
        addressInput.addEventListener('focus', handleAddressInput);
    }

    if(eventTypeSelect){
        eventTypeSelect.addEventListener('change', updateOtherEventField);
    }

    if(addressSuggestions){
        addressSuggestions.addEventListener('click', (event) => {
            const button = event.target.closest('.address-suggestion');
            if(!button) return;
            const street = button.dataset.street || '';
            const neighborhood = button.dataset.neighborhood || '';
            const city = button.dataset.city || '';
            const state = button.dataset.state || '';
            if(addressInput){
                addressInput.value = street;
            }
            if(neighborhoodInput){
                neighborhoodInput.value = neighborhood;
            }
            if(cityInput){
                cityInput.value = city;
            }
            if(stateInput){
                stateInput.value = state;
            }
            hideAddressSuggestions();
        });
    }

    document.addEventListener('click', (event) => {
        if(addressInput && addressSuggestions && !addressInput.contains(event.target) && !addressSuggestions.contains(event.target)){
            hideAddressSuggestions();
        }
    });

    if(quoteForm){
        quoteForm.addEventListener('submit', function(e){
            e.preventDefault();

            const formData = new FormData(this);
            const values = Object.fromEntries(formData.entries());
            const eventType = values.eventType === 'Outros' ? (values.eventTypeOther || 'Outros') : values.eventType || '-';
            const contact = [values.phone, values.email].filter(Boolean).join(' / ') || '-';
            const addressLine = values.street || '-';
            const formatDateBR = (isoDate) => {
                if(!isoDate) return '-';
                const [year, month, day] = isoDate.split('-');
                return `${day}/${month}/${year}`;
            };
            const message = [
                'Olá! Gostaria de solicitar um orçamento para buffet de churrasco.',
                '',
                `Nome: ${values.name || '-'}`,
                `Contato: ${contact}`,
                `Tipo de evento: ${eventType}`,
                `Quantidade de convidados: ${values.guests || '-'}`,
                `Data: ${formatDateBR(values.date)}`,
                `Horário: ${values.time || '-'}`,
                `Endereço: ${addressLine}`,
                `Número: ${values.addressNumber || '-'}`,
                `Bairro: ${values.neighborhood || '-'}`,
                `Cidade: ${values.city || '-'}`,
                `Estado: ${values.state || '-'}`,
                `Observações: ${values.notes || '-'}`
            ].join('\n');

            const whatsappUrl = `https://wa.me/5531983427552?text=${encodeURIComponent(message)}`;
            const emailUrl = `mailto:contato@meatgrill.com.br?subject=${encodeURIComponent('Solicitação de orçamento - Meat Grill')}&body=${encodeURIComponent(message)}`;
            const quoteMessage = document.getElementById('quoteMessage');

            if(sendWhatsapp){ sendWhatsapp.href = whatsappUrl; }
            if(sendEmail){ sendEmail.href = emailUrl; }
            if(quoteMessage){ quoteMessage.value = message; }
            if(quoteOptions){ quoteOptions.classList.remove('hidden'); }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId.startsWith('#') && targetId.length > 1){
                e.preventDefault();
                const el = document.querySelector(targetId);
                if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
            }
        });
    });
});
