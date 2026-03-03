import { OrdersService } from "./orders.service.js";
import { OrdersRender } from "./orders.render.js";
import { OrdersEvents } from "./orders.events.js";

export async function loadOrderDetailPage(poId) {

  const container = document.getElementById("pageContainer");

  container.innerHTML = `
    <div id="orderDetailRoot" class="order-detail-root">
      <div id="orderThreadPanel"></div>
    </div>
  `;

  await OrdersService.loadThread(poId);

  OrdersRender.renderThread();
  OrdersEvents.init();
}