import { Card } from './models/card';
import { Stats } from './stats';
import { starterDecks } from './starter-decks';
import { Exporter } from './exporter';
import { CardDragger } from './card-dragger';

const inkImages: { [id: string]: string } = {
    'amber': require('./images/inks/amber.png'),
    'emerald': require('./images/inks/emerald.png'),
    'ruby': require('./images/inks/ruby.png'),
    'sapphire': require('./images/inks/sapphire.png'),
    'steel': require('./images/inks/steel.png'),
    'amethyst': require('./images/inks/amethyst.png')
};

export class DeckPage {
    private cardDragger: CardDragger | undefined;
    public cards: Card[] = [];
    public selectedCard = -1;

    public loadDeckFromBase64(encodedString: string): void {
        this.fetchData(encodedString)
            .then((cards) => {
                this.cards = cards;
                this.renderCards(cards);

                const container = document.getElementById('get-booster-button');
                if (!container) return;
                container.style.display = "inline-block";

                this.cardDragger = (window as any).cardDragger as CardDragger;
                this.cardDragger.setupDragging();
                const deckContainer = document.getElementById('deck');
                if (deckContainer) {
                    deckContainer.addEventListener('dragover', (event) => this.handleDragOver(event));
                    deckContainer.addEventListener('drop', (event) => this.handleDrop(event));
                }
            })
            .catch(error => {
                console.error('Error fetching and rendering data:', error);
            });
    }

    private async fetchData(encodedDeck: string): Promise<Card[]> {
        try {
            const response = await fetch(`/api/deck?encodedString=${encodedDeck}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    private async renderCards(cards: Card[]): Promise<void> {
        const container = document.getElementById('deck');
        if (!container) {
            console.error('Container not found');
            return;
        }

        container.innerHTML = '';

        cards.forEach((card, i) => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.classList.add('deck-card');
            cardElement.setAttribute("position", i.toString());

            const imageElement = document.createElement('img');
            imageElement.src = card.images.full;
            imageElement.alt = card.fullName;
            if (i == this.selectedCard) imageElement.classList.add('selected');

            const nameElement = document.createElement('p');
            nameElement.textContent = card.fullName;

            cardElement.appendChild(imageElement);
            cardElement.appendChild(nameElement);

            container.appendChild(cardElement);
        });

        this.updateCardRules(cards);
        this.updateCardCounts(cards.length);
        Stats.drawCostGraph(cards);
    }

    private updateCardRules(cards: Card[]): void {
        const imageContainers = document.getElementsByClassName('ink-token') as HTMLCollectionOf<HTMLImageElement>;
        const inkCountContainers = document.getElementsByClassName('ink-card-counter');
        if (!imageContainers || !inkCountContainers) return;

        const inks: string[] = this.getInks(cards);
        let inkCounts: Record<string, number> = {};
        cards.forEach(card => {
            if (card.color in inkCounts) {
                inkCounts[card.color] += 1;
            } else {
                inkCounts[card.color] = 1;
            }
        });

        inks.forEach((ink, i) => {
            imageContainers[i]!.src = inkImages[ink.toLowerCase()];
            imageContainers[i].setAttribute('title', ink);
            imageContainers[i].setAttribute('ink', ink.toLowerCase());
            inkCountContainers[i].innerHTML = `${inkCounts[ink]}`;
        });
    }

    private getInks(cards: Card[]): string[] {
        const inks: string[] = [];
        cards.forEach((card: Card) => {
            if (inks.indexOf(card.color) == -1) {
                inks.push(card.color);
            }
        });

        return inks;
    }

    private handleDrop(event: DragEvent) {
        this.cardDragger!.handleDropIntoDeck(event);
    }

    private handleDragOver(event: DragEvent) {
        event.preventDefault();
    }

    public insertCard(card: Card) {
        this.cards.push(card);
        this.renderCards(this.cards);
    }

    public getCard(position: number): Card {
        const card = this.cards.splice(position, 1)[0];
        this.renderCards(this.cards);
        return card;
    }

    private updateCardCounts(numCards: number): void {
        const container = document.getElementById('card-count');
        if (!container) return;
        container.innerHTML = `${numCards}/60`;
    }

    public chooseStarterDeck(selectedDeck: string) {
        this.loadDeckFromBase64(starterDecks[selectedDeck]);
        this.showHideStarterDeckSelector('none');
    }

    public showHideStarterDeckSelector(display: string) {
        const container = document.getElementById('starter-deck-chooser');
        if (!container) return;
        container.style.display = display;
    }

    public exportDeck() {
        const exportCode: string = Exporter.generatePixelbornImportCode(this.cards);

        const container = document.getElementById('export-window') as HTMLDivElement;
        const textbox = document.getElementById('pixelborn-code') as HTMLTextAreaElement;
        if (!container || !textbox) {
            console.error('Container not found');
            return;
        }

        textbox.value = exportCode;
        container.style.display = 'block';
    }

    public closeExportWindow() {
        const container = document.getElementById('export-window') as HTMLDivElement;
        if (!container) {
            console.error('Container not found');
            return;
        }
        container.style.display = 'none';
    }
}

(window as any).deckpage = new DeckPage();