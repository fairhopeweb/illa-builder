import { createBrowserRouter } from "react-router-dom"
import { LayoutAutoChange } from "@/components/LayoutAutoChange"
import { UpgradeCloudProvider } from "@/illa-public-component/UpgradeCloudProvider"
import { RoutesObjectPro } from "@/router/interface"
import { routerConfig } from "@/router/routerConfig"
import { isCloudVersion } from "@/utils/typeHelper"
import { beautifyURLLoader } from "./loader/beautifyURLLoader"
import { setTokenToLocalStorageLoader } from "./loader/cloudAuthLoader"
import {
  combineCloudAuthLoader,
  combineSelfHostAuthLoader,
} from "./loader/index"

const wrappedRouter = (
  routesConfig: RoutesObjectPro[],
  _isChildren?: boolean,
) => {
  return routesConfig.map((routeItem: RoutesObjectPro) => {
    const {
      element,
      children,
      needLogin,
      loader: originLoader,
      ...otherRouteProps
    } = routeItem
    const newRouteItem: RoutesObjectPro = {
      ...otherRouteProps,
    }
    if (!newRouteItem.accessByMobile) {
      newRouteItem.element = <LayoutAutoChange desktopPage={element} />
    } else {
      newRouteItem.element = element
    }
    if (isCloudVersion) {
      newRouteItem.element = (
        <UpgradeCloudProvider>{newRouteItem.element}</UpgradeCloudProvider>
      )
    }
    newRouteItem.loader = async (args) => {
      if (isCloudVersion) {
        await setTokenToLocalStorageLoader(args)
        const beautifyURLResponse = await beautifyURLLoader(args)
        if (beautifyURLResponse) {
          return beautifyURLResponse
        }
        let authLoaderResponse
        if (needLogin) {
          authLoaderResponse = await combineCloudAuthLoader(args)
        }
        if (authLoaderResponse) {
          return authLoaderResponse
        }
      } else {
        let authLoaderResponse
        if (needLogin) {
          authLoaderResponse = await combineSelfHostAuthLoader(args)
        }
        if (authLoaderResponse) {
          return authLoaderResponse
        }
      }
      if (originLoader) {
        return await originLoader(args)
      }
      return null
    }
    if (Array.isArray(children) && children.length) {
      newRouteItem.children = wrappedRouter(children, true)
    }

    return newRouteItem
  })
}

export const ILLARoute = createBrowserRouter(wrappedRouter(routerConfig))
