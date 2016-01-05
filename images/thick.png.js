define(function (require) {

return 'data:image/png;base64,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';
});