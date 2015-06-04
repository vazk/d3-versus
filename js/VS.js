
var VS = {
    ctx:  document.createElement('canvas').getContext("2d"),

    computeTextWidth: function(text, font) {
        this.ctx.font = font;        
        return this.ctx.measureText(text).width;
    }
};