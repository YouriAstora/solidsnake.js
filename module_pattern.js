//cf https://toddmotto.com/mastering-the-module-pattern/
var Module = (function () {
    var _privateMethod = function(){
        console.log("Private talking")
    };

    return {
        publicMethod: function () {
          console.log("Public speech")
        }
    };

})();
