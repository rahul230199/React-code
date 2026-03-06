/* =========================================================
AXO NETWORKS — ORDER THREAD PANEL
Combines Header + Tabs
========================================================= */

import { OrderHeader } from "./order.header.js";
import { OrderTabs } from "./order.tabs.js";


export const OrderThreadPanel = {

  render(data = {}) {

    return `

      ${OrderHeader.render(data)}

      ${OrderTabs.render(data)}

    `;

  }

};