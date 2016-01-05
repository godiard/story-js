define(function (require) {

return 'data:image/png;base64,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';
});