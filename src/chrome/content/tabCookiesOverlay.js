// Copyright 2004 - 2015 Edwin Martin
// This code is triple licensed under MPL/GPL/LGPL. See license.txt for details.

var CookiePage = (function() {
	var treeView = {
		data: [],
		rowCount: 0,
		tree: null,
		cols: [],
		setRows: function( rows ) {
			if ( this.tree.view.selection.count )
				this.tree.view.selection.clearSelection();
			this.tree.rowCountChanged(this.rowCount-1, -this.rowCount);
			this.data = rows;
			this.rowCount = rows.length;
			this.tree.rowCountChanged(0, this.rowCount);
		},
		setColumns: function( cols ) {
			for ( var i=0; i<cols.length; i++ )
				this.cols[cols[i]] = i;
		},
		getSelectedIndex: function() {
			return this.tree.selection.currentIndex;
		},
		getCellText: function( row, column ) {
			// Use || to keep compatibility with older versions
			return this.data[row][this.cols[column.id||column]];
		},
		setTree: function( tree ) {
			this.tree = tree;
		},
		isContainer: function(row){ return false; },
		isSeparator: function(row){ return false; },
		isSorted: function(row){ return false; },
		getLevel: function(row){ return 0; },
		getImageSrc: function(row,col){ return null; },
		getRowProperties: function(row,props){},
		getCellProperties: function(row,col,props){},
		getColumnProperties: function(colid,col,props){},
	};

	return {
		onLoad: onLoad,
		treeView: treeView,
		deleteAllCookiesFromList: deleteAllCookiesFromList,
		deleteCookie: deleteCookie,
		itemSelected: itemSelected
	};
	
	function onLoad() {
		var cookie, expires;
		var cookieTree = document.getElementById("cookiepage-tab-tree");
		cookieTree.view = treeView;
		treeView.setColumns( ["cookie-name", "cookie-value", "cookie-domain", "cookie-path", "cookie-expires", "cookie-secure"] );
		var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
		var cookies = [];
		// Other way to get url?
		var uri = getUri();
		var domain = uri.host;
		var path = uri.path;
		var iter = cookieManager.enumerator;
		var dotDomain;
		while ( iter.hasMoreElements() ){
			cookie = iter.getNext();
			dotDomain = '.'+domain;
			if ( cookie instanceof Components.interfaces.nsICookie && endsWith( dotDomain, cookie.host ) && beginsWith( path, cookie.path ) ) {
				if ( cookie.expires==0 ) {
					expires = "Session"
				} else {
					var d = new Date( cookie.expires*1000 );
					expires = d.toLocaleString();
				}
				cookies.push( [cookie.name, cookie.value, cookie.host, cookie.path, expires, cookie.isSecure?'Yes':'No'] );
			}
		}
		treeView.setRows( cookies );
	
		setDetail( "", "", "", "", "" );
		document.getElementById("remove").disabled = true;
		document.getElementById("removeAll").disabled = treeView.rowCount == 0;
	//	if (cookies.length > 0)
	//		treeView.selection.select(0);
	}
	
	function itemSelected() {
		var selectedIndex = treeView.selection.currentIndex;
		setDetail( 	treeView.getCellText(selectedIndex, "cookie-name"),
				treeView.getCellText(selectedIndex, "cookie-value"),
				treeView.getCellText(selectedIndex, "cookie-expires"),
				treeView.getCellText(selectedIndex, "cookie-domain")+treeView.getCellText(selectedIndex, "cookie-path"),
				treeView.getCellText(selectedIndex, "cookie-secure"));
		document.getElementById("remove").disabled = false;
	}
	
	function deleteCookie() {
		var selectedIndex = treeView.selection.currentIndex;
		var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
		cookieManager.remove( treeView.getCellText(selectedIndex, "cookie-domain"), treeView.getCellText(selectedIndex, "cookie-name"), treeView.getCellText(selectedIndex, "cookie-path"), false );
		onLoad();
		if (selectedIndex < treeView.data.length)
			treeView.selection.select(selectedIndex);
	}
	
	function deleteAllCookiesFromList() {
		var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
		for (var i = 0; i < treeView.rowCount; i++) {
			cookieManager.remove( treeView.getCellText(i, "cookie-domain"), treeView.getCellText(i, "cookie-name"), treeView.getCellText(i, "cookie-path"), false );
		}	
		onLoad();
	}
	
	function deleteAllCookies() {
		var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
		cookieManager.removeAll();
		onLoad();
	}
	
	function setDetail( name, value, expires, path, secure ) {
		document.getElementById("cookiepage-tab-name").value = name;
		document.getElementById("cookiepage-tab-value").value = value;
		document.getElementById("cookiepage-tab-path").value = path;
		document.getElementById("cookiepage-tab-expires").value = expires + (secure=="Yes"?" (secure cookie)":"");
	}
	
	function endsWith(t, s) {
		if ( t.length < s.length )
			return false;
		return t.substr( t.length-s.length ) == s;
	}
	
	function beginsWith(t, s) {
		if ( t.length < s.length )
			return false;
		return t.substr( 0, s.length ) == s;
	}

	function getUri() {
		var windowsService = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		var currentWindow = windowsService.getMostRecentWindow('navigator:browser');
		var browser = currentWindow.getBrowser();

		return browser.currentURI;
	}
})();
