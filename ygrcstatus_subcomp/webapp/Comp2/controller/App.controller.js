sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("ygrcstatus.Comp2.controller.App", {
        onInit() {
          alert("this is app"); 
        }
      });
    }
  );


