---
title: "yolov8-ultralytics-利用TP、TN、FP、FN添加mIoU指标"
date: 2024-10-27 18:18:20
category: "目标检测"
tags:
- "YOLO"
---



1. 在文件ultralytics/utils/metrics.py中的ConfusionMatrix类里 tp_fp 函数下方添加函数tp_fp_fn：

```python
def tp_fp_fn(self):
    """Returns true positives, false positives and false negative."""
    tp = self.matrix.diagonal()
    fp = self.matrix.sum(1) - tp
    fn = self.matrix.sum(0) - tp
    return (tp[:-1], fp[:-1], fn[:-1]) if self.task == "detect" else (tp, fp, fn)
```

如下图：
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/451a3ac3053f4aff9b21d967e6f4d11d.png)

2. 在文件ultralytics/models/yolo/detect/val.py中的DetectionValidator类里 __ init __ 函数中添加字典变量 class_iou ：

```python
def __init__(self, dataloader=None, save_dir=None, pbar=None, args=None, _callbacks=None):
    """Initialize detection model with necessary variables and settings."""
    super().__init__(dataloader, save_dir, pbar, args, _callbacks)
    # ===========添加===========
    self.class_iou = dict()
    # ==========================
    self.nt_per_class = None
    self.nt_per_image = None
```

类中 get_desc 函数中添加 mIoU：

```python
def get_desc(self):
    """Return a formatted string summarizing class metrics of YOLO model."""
    return ("%22s" + "%11s" * 7) % ("Class", "Images", "Instances", "Box(P", "R", "mAP50", "mAP50-95", "mIoU)")
```

类中添加两个新函数 calculate_iou 和 calculate_miou：

```python
def calculate_iou(self):
    """Calculate IoU for each class based on the updated confusion matrix."""
    tp, fp, fn = self.confusion_matrix.tp_fp_fn()
    denominator = tp + fp + fn
    iou = np.zeros_like(tp, dtype=float)
    non_zero_denominator = denominator != 0
    iou[non_zero_denominator] = tp[non_zero_denominator] / denominator[non_zero_denominator]

    for class_idx in range(self.nc):
        self.class_iou[class_idx] = iou[class_idx]

def calculate_miou(self):
    """Calculate mean IoU over all classes."""
    valid_classes = [class_idx for class_idx in range(self.nc) if self.class_iou[class_idx] is not None and self.class_iou[class_idx] != 0.0]
    miou = np.mean(np.array([self.class_iou[class_idx] for class_idx in valid_classes])) if len(
        valid_classes) > 0 else 0.0
    return miou
```

再修改类中的 update_metrics 函数：

```python
if npr == 0:
    if nl:
        for k in self.stats.keys():
            self.stats[k].append(stat[k])
        ===========================修改处=============================
        self.confusion_matrix.process_batch(detections=None, gt_bboxes=bbox, gt_cls=cls)
        self.calculate_iou()
        ==============================================================
    continue

# Predictions
if self.args.single_cls:
    pred[:, 5] = 0
predn = self._prepare_pred(pred, pbatch)
stat["conf"] = predn[:, 4]
stat["pred_cls"] = predn[:, 5]

# Evaluate
if nl:
    stat["tp"] = self._process_batch(predn, bbox, cls)
    ===========================修改处=============================
    self.confusion_matrix.process_batch(predn, bbox, cls)
    self.calculate_iou()
    ==============================================================
for k in self.stats.keys():
    self.stats[k].append(stat[k])
```

修改位置如下图：
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/532bbc8f057a40dc900744c02b016359.png)

最后修改 print_results 函数：

```python
def print_results(self):
    """Prints training/validation set metrics per class."""
    ===========================修改处=============================
    pf = "%22s" + "%11i" * 2 + "%11.3g" * (len(self.metrics.keys) + len(["metrics/mIoU(B)"]))  # print format
    LOGGER.info(
        pf % ("all", self.seen, self.nt_per_class.sum(), *self.metrics.mean_results(), self.calculate_miou()))
    ==============================================================
    if self.nt_per_class.sum() == 0:
        LOGGER.warning(
            f"WARNING ⚠️ no labels found in {self.args.task} set, can not compute metrics without labels")

    # Print results per class
    if self.args.verbose and not self.training and self.nc > 1 and len(self.stats):
        for i, c in enumerate(self.metrics.ap_class_index):
            ===========================修改处=============================
            LOGGER.info(
                pf % (self.names[c], self.nt_per_image[c], self.nt_per_class[c], *self.metrics.class_result(i),
                      self.class_iou.get(i, 0.0))
            )
            ==============================================================

    if self.args.plots:
        for normalize in True, False:
            self.confusion_matrix.plot(
                save_dir=self.save_dir, names=self.names.values(), normalize=normalize, on_plot=self.on_plot
            )
```

1. 修改完成，最终输出指标如下图：
    ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f985e2a05a8c4f3c946dc5f91a221dc2.png)

