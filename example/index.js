import { Version } from "uniapp-update";

export default {
  methods: {
    update() {
      new Version({
        autoCheck: true,

        customGetVersion() {
          // 这个需要自己请求，已适应私有化部署
          return new Promise((resolve, reject) => {
            var teamID = "123123"; // app.adtk.cn的团队id
            var bundleID = "cn.adtk.app"; //你的App包名

            var platform = this.isAndroid() ? "android" : "ios"; //  平台
            var appVersionCode = this.getVersionCode(); // 当前版本号
            var wgtVersion = this.getWgtVersion(); // 当前版本号

            uni
              .$get(`https://app.adtk.cn/api/version/checkupdate`, {
                t: Date.now(),
                teamID,
                platform,
                bundleID,
                appVersionCode,
                wgtVersion,
              })
              .then((res) => {
                console.log(res);
                if (res.success && res.data) {
                  resolve(res.data);
                } else {
                  // reject(new Error("没有获取到版本信息"));
                }
              })
              .catch((err) => {
                console.log(err);
                reject(err);
              });
          });
        },
        onDownloadProcess(percent, downloadedSize, totalSize) {
          console.log(percent, downloadedSize, totalSize);
        },
        onDownloadSuccess(tempFilePath, version) {
          console.log(tempFilePath);
        }, //下载完成回调,返回false则不安装
        onInstallError() {},
        onError(err) {
          uni.showToast({
            title: err.message,
            icon: "none",
            duration: 2000,
          });
        },
      });
    },
  },
  onload() {
    this.update();
  },
};
