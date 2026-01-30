from .report import report, save, save_runtime, save_id


class Model:
    report = staticmethod(report)
    save = staticmethod(save)
    save_runtime = staticmethod(save_runtime)
    save_id = staticmethod(save_id)
