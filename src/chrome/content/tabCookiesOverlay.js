// Copyright 2004 - 2015 Edwin Martin
// This code is triple licensed under MPL/GPL/LGPL. See license.txt for details.

var CookiePage = (function() {
 var treeView = {
  data: [],
  rowCount: 0,
  tree: null,
  cols: [],
  setRows: function(rows)
  {
   if (this.tree.view.selection.count)
    this.tree.view.selection.clearSelection();
   this.tree.rowCountChanged(this.rowCount - 1, -this.rowCount);
   this.data = rows;
   this.rowCount = rows.length - 1;
   this.tree.rowCountChanged(0, this.rowCount);
  },
  setColumns: function(cols)
  {
   for (let i = 0; i < cols.length; i++)
   {
    this.cols[cols[i]] = i;
   }
  },
  getSelectedIndex: function()
  {
   return this.tree.selection.currentIndex;
  },
  getCellText: function(row, column)
  {
   if (this.data.length <= row)
    return null;
   let col = -1;
   if (typeof column === 'string')
   {
    if (this.cols.hasOwnProperty(column))
     col = this.cols[column];
   }
   else
   {
    if (this.cols.hasOwnProperty(column.id))
     col = this.cols[column.id];
   }
   if (col === -1)
    return null;
   if (this.data[row].length <= col)
    return null;
   return this.data[row][col];
  },
  setTree: function(tree)
  {
   this.tree = tree;
  },
  isContainer: function(row) {return false;},
  isSeparator: function(row) {return false;},
  isSorted: function(row) {return false;},
  getLevel: function(row) {return 0;},
  getImageSrc: function(row,col) {return null;},
  getRowProperties: function(row,props) {},
  getCellProperties: function(row,col,props) {},
  getColumnProperties: function(colid,col,props) {},
 };
 return {
  onLoad: onLoad,
  treeView: treeView,
  deleteAllCookiesFromList: deleteAllCookiesFromList,
  deleteCookie: deleteCookie,
  itemSelected: itemSelected
 };
 function onLoad()
 {
  let cookieTree = document.getElementById('cookiepage-tab-tree');
  cookieTree.view = treeView;
  treeView.setColumns(['cookie-name', 'cookie-value', 'cookie-domain', 'cookie-path', 'cookie-expires', 'cookie-secure']);
  let cookieManager = Components.classes['@mozilla.org/cookiemanager;1'].getService(Components.interfaces.nsICookieManager);
  let cookies = [];
  let uri = getUri();
  let domain = uri.host;
  let path = uri.path;
  let iter = cookieManager.enumerator;
  while (iter.hasMoreElements())
  {
   let cookie = iter.getNext();
   let dotDomain = '.' + domain;
   if (cookie instanceof Components.interfaces.nsICookie && endsWith(dotDomain, cookie.host) && beginsWith(path, cookie.path))
   {
    let expires = 'Session';
    if (cookie.expires !== 0)
    {
     let d = new Date(cookie.expires * 1000);
     expires = d.toLocaleString();
    }
    cookies.push([cookie.name, cookie.value, cookie.host, cookie.path, expires, cookie.isSecure ? 'Yes' : 'No', cookie.originAttributes]);
   }
  }
  treeView.setRows(cookies);
  setDetail('', '', '', '', '');
  document.getElementById('remove').disabled = true;
  document.getElementById('removeAll').disabled = treeView.rowCount === 0;
 }
 function itemSelected()
 {
  let selectedIndex = treeView.selection.currentIndex;
  setDetail(treeView.getCellText(selectedIndex, 'cookie-name'),
            treeView.getCellText(selectedIndex, 'cookie-value'),
            treeView.getCellText(selectedIndex, 'cookie-expires'),
            treeView.getCellText(selectedIndex, 'cookie-domain') + treeView.getCellText(selectedIndex, 'cookie-path'),
            treeView.getCellText(selectedIndex, 'cookie-secure'));
  document.getElementById('remove').disabled = false;
 }
 function deleteCookie()
 {
  let selectedIndex = treeView.selection.currentIndex;
  let cookieManager = Components.classes['@mozilla.org/cookiemanager;1'].getService(Components.interfaces.nsICookieManager);
  cookieManager.remove(treeView.getCellText(selectedIndex, 'cookie-domain'), treeView.getCellText(selectedIndex, 'cookie-name'), treeView.getCellText(selectedIndex, 'cookie-path'), false, treeView.data[selectedIndex][6]);
  onLoad();
  if (selectedIndex < treeView.data.length)
   treeView.selection.select(selectedIndex);
  else if (selectedIndex === treeView.data.length)
   treeView.selection.select(selectedIndex - 1);
 }
 function deleteAllCookiesFromList()
 {
  let cookieManager = Components.classes['@mozilla.org/cookiemanager;1'].getService(Components.interfaces.nsICookieManager);
  for (let i = 0; i < treeView.rowCount; i++)
  {
   cookieManager.remove(treeView.getCellText(i, 'cookie-domain'), treeView.getCellText(i, 'cookie-name'), treeView.getCellText(i, 'cookie-path'), false, treeView.data[i][6]);
  }
  onLoad();
 }
 function deleteAllCookies()
 {
  let cookieManager = Components.classes['@mozilla.org/cookiemanager;1'].getService(Components.interfaces.nsICookieManager);
  cookieManager.removeAll();
  onLoad();
 }
 function setDetail(name, value, expires, path, secure)
 {
  document.getElementById('cookiepage-tab-name').value = name;
  document.getElementById('cookiepage-tab-value').value = value;
  document.getElementById('cookiepage-tab-path').value = path;
  document.getElementById('cookiepage-tab-expires').value = expires + (secure==='Yes' ? ' (secure cookie)' : '');
 }
 function endsWith(t, s)
 {
  if (t.length < s.length)
   return false;
  return t.substr(t.length-s.length) === s;
 }
 function beginsWith(t, s)
 {
  if (t.length < s.length)
   return false;
  return t.substr(0, s.length) === s;
 }
 function getUri()
 {
  let windowsService = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
  let currentWindow = windowsService.getMostRecentWindow('navigator:browser');
  let browser = currentWindow.getBrowser();
  return browser.currentURI;
 }
})();
