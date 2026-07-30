"""Normalize common scenic-guide ASR and input variants before retrieval."""

import re


_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    ("灵山警区", "灵山景区"),
    ("灵山境区", "灵山景区"),
    ("灵山风景区", "灵山景区"),
    ("灵山圣境", "灵山胜境"),
    ("灵山盛景", "灵山胜境"),
    ("灵山圣景", "灵山胜境"),
    ("灵山大付", "灵山大佛"),
    ("灵山大服", "灵山大佛"),
    ("九龙观浴", "九龙灌浴"),
    ("九龙灌玉", "九龙灌浴"),
    ("九龙贯玉", "九龙灌浴"),
    ("九龙官浴", "九龙灌浴"),
    ("九龙罐浴", "九龙灌浴"),
    ("九龙灌喻", "九龙灌浴"),
    ("九龙冠玉", "九龙灌浴"),
    ("九龙灌育", "九龙灌浴"),
    ("九龙关浴", "九龙灌浴"),
    ("凡宫", "梵宫"),
    ("梵公", "梵宫"),
    ("梵工", "梵宫"),
    ("五音坛城", "五印坛城"),
    ("五印坛成", "五印坛城"),
    ("祥福禅寺", "祥符禅寺"),
    ("相符禅寺", "祥符禅寺"),
    ("佛祖坛", "佛足坛"),
    ("佛足檀", "佛足坛"),
    ("佛祖檀", "佛足坛"),
    ("佛祖台", "佛足坛"),
    ("佛足台", "佛足坛"),
    ("青筒", "青铜"),
    ("清铜", "青铜"),
    ("青铜佛祖印", "青铜佛足印"),
    ("青铜佛足意", "青铜佛足印"),
    ("青铜佛祖意", "青铜佛足印"),
    ("佛祖印", "佛足印"),
    ("佛祖意", "佛足印"),
    ("将解", "讲解"),
)


def normalize_scenic_query(text: str) -> str:
    """Apply deterministic corrections for Lingshan scenic terms."""
    normalized = (text or "").strip()
    if not normalized:
        return normalized

    for wrong, right in _REPLACEMENTS:
        normalized = normalized.replace(wrong, right)

    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()
