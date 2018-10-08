import _get from 'lodash/get';
import _merge from 'lodash/merge';
import _throttle from 'lodash/throttle';
import EventManager from './../services/pubsub';
import {EVENT_PAGE_WRAP_SCROLL, EVENT_MENU_OPENED, EVENT_CATEGORIES_CHANGED} from './../constants/events';

const MODE_SCROLL = 'scroll';
const MODE_EVENT = 'event';

const defaults = {
    animationLength: 250,
    scrollThreshold: 200,
    selectors: {
        root: '.js-lazy-load',
        pageContainer: '.l-page-wrap',
    },
    styles: {
        preload: 'on-init',
    },
};

const _dependencies = {
    EventManager,
};

const _events = {
    [MODE_SCROLL]: [EVENT_PAGE_WRAP_SCROLL],
    [MODE_EVENT]: [EVENT_MENU_OPENED, EVENT_CATEGORIES_CHANGED],
};

const lazyLoadImagesMap = {
    [MODE_SCROLL]: new Map(),
    [MODE_EVENT]: new Map(),
};

class LazyLoad {
    constructor(elm, settings = {}, dependencies = _dependencies, events = _events) {
        _merge(this, dependencies);
        this.events = events;

        this.settings = _merge({}, defaults, settings);
        this.$el = $(elm);

        this.mode = this.$el.data('mode') || MODE_SCROLL;

        if (![MODE_SCROLL, MODE_EVENT].includes(this.mode)) {
            console.error(`Wrong mode ['${this.mode}'] set on lazyLoad element!`);
            return;
        }

        if (this.mode === MODE_SCROLL) {
            this.bindScrollEvent();
        }

        this.addInitialClass();
        this.subscribeOnEvents();

        lazyLoadImagesMap[this.mode].set(elm, this);

        if (this.mode === MODE_SCROLL) {
            this.loadImageIfVisible();
        }
    }

    addInitialClass() {
        this.$el.addClass(this.settings.styles.preload);
    }

    bindScrollEvent() {
        if (lazyLoadImagesMap[MODE_SCROLL].size > 0) {
            return;
        }
        $(this.settings.selectors.pageContainer).on(
            'scroll.lazyload',
            _throttle(
                () => {
                    this.EventManager.publish(EVENT_PAGE_WRAP_SCROLL);
                },
                500,
                {trailing: true}
            )
        );
    }

    checkImageVisibility(windowHeight) {
        const currentOffsetTop = this.$el.offset().top;
        return currentOffsetTop <= windowHeight + this.settings.scrollThreshold;
    }

    loadImageIfVisible(windowHeight = $(this.settings.selectors.pageContainer).innerHeight()) {
        if (!this.checkImageVisibility(windowHeight)) {
            return;
        }

        this.loadImage();
    }

    loadImage() {
        const $image = this.$el;
        const imageUrl = $image.data('img-url');
        const imageTag = $image[0].tagName;
        const targetImage = new Image();

        targetImage.onload = () => {
            $image.addClass('is-hidden');

            setTimeout(() => {
                if (imageTag === 'IMG') {
                    $image.attr('src', targetImage.src);
                } else {
                    $image.css('background-image', `url(${targetImage.src})`);
                }

                $image.removeClass('is-hidden');
                $image.removeClass(this.settings.styles.preload);
            }, this.settings.animationLength);
        };

        targetImage.src = imageUrl;

        this.unsubscribe();
    }

    subscribeOnEvents() {
        const callbacks = {
            [MODE_SCROLL]: LazyLoad.handleScrollEvent,
            [MODE_EVENT]: LazyLoad.handleShowEvent,
        };

        if (lazyLoadImagesMap[this.mode].size > 0) {
            return;
        }

        for (let e of this.events[this.mode]) {
            this.EventManager.subscribe(e, callbacks[this.mode]);
        }
    }

    unsubscribe() {
        lazyLoadImagesMap[this.mode].delete(this.$el[0]);

        if (lazyLoadImagesMap[MODE_SCROLL].size === 0) {
            $(this.settings.selectors.pageContainer).off('scroll.lazyload');
        }
    }

    static handleScrollEvent() {
        const windowHeight = $(defaults.selectors.pageContainer).innerHeight();

        lazyLoadImagesMap[MODE_SCROLL].forEach(obj => {
            obj.loadImageIfVisible(windowHeight);
        });
    }

    static handleShowEvent({$imageContainer}) {
        const container = $imageContainer[0];

        lazyLoadImagesMap[MODE_EVENT].forEach((obj, elm) => {
            if (!container.contains(elm)) {
                return;
            }

            obj.loadImage();
        });
    }

    static init(settings = {}) {
        const selector = _get(settings, 'selectors.root', defaults.selectors.root);

        $(selector).each((_, elm) => {
            new LazyLoad(elm, settings);
        });
    }
}

export default LazyLoad;
