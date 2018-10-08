// Plugins
// JQuery
require('imports-loader?define=>false,module=>undefined!jquery');
import popper from 'popper.js';
import bootstrap from 'bootstrap';

// Content
require.context('../fonts', true, /\.(woff|woff2|otf|ttf|eot)$/);
require.context('../img', true, /\.(png|jpg|jpeg|gif|ico|webp|webmanifest)$/);

// Modules
import LazyLoad from './components/lazy-load';

function bootstrapComponents() {
    LazyLoad.init();
}

function initApp() {
    $(function() {
        bootstrapComponents();

    });
}

if (window.Raven) {
    sentry(initApp);
} else {
    initApp();
}
