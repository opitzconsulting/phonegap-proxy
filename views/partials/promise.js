function Promise() {
    var callback = {};
    var result = {};

    function doCallbackIfResult() {
      if (result) {
        if (result.resolve && callback.resolve) {
          callback.resolve.apply(this, result.resolve);
        } else if (result.reject && callback.reject) {
          callback.reject.apply(this, result.reject);
        }
      }
    }

    return {
      then: function(success, error) {
        callback = {
          resolve: success,
          reject: error
        };
        doCallbackIfResult();
      },
      resolve: function() {
        result.resolve = Array.prototype.slice.call(arguments);
        doCallbackIfResult();
      },
      reject: function() {
        result.reject = Array.prototype.slice.call(arguments);;
        doCallbackIfResult();
      }
    }
}

if (typeof exports!=="undefined") {
  exports.Promise = Promise;
}