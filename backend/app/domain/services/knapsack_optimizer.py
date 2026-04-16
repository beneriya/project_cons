"""Knapsack-based minimum cost optimizer for parquet flooring.

Problem formulation (Bounded Knapsack — Minimum Cost Variant):
  Given N materials, each with:
    - cost_per_box (price)
    - m2_per_box (coverage)
    - available_boxes (stock limit)
  Find the combination of boxes that covers >= required_area at minimum total cost.

  Minimize:  Σ (boxes_i × price_i)
  Subject to: Σ (boxes_i × m2_per_box_i) >= area_with_waste
              0 <= boxes_i <= available_boxes_i

Uses dynamic programming on discretized area (granularity 0.01 m²).
Time complexity: O(N × A × max_boxes) where A = area in centisquare-meters.
"""

import math
from dataclasses import dataclass, field


@dataclass
class MaterialOption:
    """A candidate material for the optimizer."""
    id: str
    name: str
    m2_per_box: float
    price_per_box: float
    available_boxes: int


@dataclass
class AllocationItem:
    """How many boxes of a specific material to use."""
    material_id: str
    material_name: str
    boxes: int
    m2_covered: float
    cost: float
    price_per_box: float
    m2_per_box: float


@dataclass
class OptimizationResult:
    """Result comparing naive (single best) vs knapsack-optimized solution."""
    # Naive: cheapest single material
    naive_material_id: str
    naive_material_name: str
    naive_boxes: int
    naive_cost: float
    naive_m2_covered: float

    # Optimized: knapsack DP solution
    optimized_allocations: list[AllocationItem] = field(default_factory=list)
    optimized_total_cost: float = 0.0
    optimized_total_m2: float = 0.0
    optimized_total_boxes: int = 0

    # Comparison
    cost_savings: float = 0.0
    savings_percentage: float = 0.0

    # Meta
    required_area_m2: float = 0.0
    waste_percentage: float = 0.0
    area_with_waste_m2: float = 0.0


class KnapsackOptimizer:
    """Minimum-cost bounded knapsack optimizer for floor covering."""

    # Discretize area to centisquare-meters (0.01 m²) for DP table
    GRANULARITY = 0.01

    @classmethod
    def optimize(
        cls,
        required_area_m2: float,
        waste_percentage: float,
        materials: list[MaterialOption],
    ) -> OptimizationResult:
        if not materials:
            raise ValueError("No materials available")
        if required_area_m2 <= 0:
            raise ValueError("Area must be positive")

        waste_multiplier = 1 + (waste_percentage / 100)
        area_with_waste = required_area_m2 * waste_multiplier

        # --- Naive solution: pick single cheapest material ---
        naive = cls._solve_naive(area_with_waste, materials)

        # --- Knapsack DP solution ---
        optimized = cls._solve_knapsack(area_with_waste, materials)

        cost_savings = naive["cost"] - optimized["cost"]
        savings_pct = (cost_savings / naive["cost"] * 100) if naive["cost"] > 0 else 0.0

        return OptimizationResult(
            naive_material_id=naive["material_id"],
            naive_material_name=naive["material_name"],
            naive_boxes=naive["boxes"],
            naive_cost=naive["cost"],
            naive_m2_covered=naive["m2_covered"],
            optimized_allocations=optimized["allocations"],
            optimized_total_cost=optimized["cost"],
            optimized_total_m2=optimized["m2_covered"],
            optimized_total_boxes=optimized["boxes"],
            cost_savings=cost_savings,
            savings_percentage=savings_pct,
            required_area_m2=required_area_m2,
            waste_percentage=waste_percentage,
            area_with_waste_m2=area_with_waste,
        )

    @staticmethod
    def _solve_naive(
        area_with_waste: float,
        materials: list[MaterialOption],
    ) -> dict:
        """Greedy: pick single material with lowest cost to cover entire area."""
        best = None
        for mat in materials:
            if mat.available_boxes <= 0:
                continue
            boxes_needed = math.ceil(area_with_waste / mat.m2_per_box)
            # Can only use what's in stock
            boxes_used = min(boxes_needed, mat.available_boxes)
            covered = boxes_used * mat.m2_per_box
            if covered < area_with_waste:
                # Not enough stock to cover — still consider but penalize
                continue
            cost = boxes_used * mat.price_per_box
            if best is None or cost < best["cost"]:
                best = {
                    "material_id": mat.id,
                    "material_name": mat.name,
                    "boxes": boxes_used,
                    "cost": cost,
                    "m2_covered": covered,
                }

        # Fallback: if no single material has enough stock, pick cheapest per m2
        if best is None:
            cheapest = min(materials, key=lambda m: m.price_per_box / m.m2_per_box)
            boxes_needed = math.ceil(area_with_waste / cheapest.m2_per_box)
            best = {
                "material_id": cheapest.id,
                "material_name": cheapest.name,
                "boxes": boxes_needed,
                "cost": boxes_needed * cheapest.price_per_box,
                "m2_covered": boxes_needed * cheapest.m2_per_box,
            }

        return best

    @classmethod
    def _solve_knapsack(
        cls,
        area_with_waste: float,
        materials: list[MaterialOption],
    ) -> dict:
        """
        DP-based bounded knapsack: minimize cost to cover >= area_with_waste.

        State: dp[a] = minimum cost to cover exactly 'a' discretized area units.
        Transition: for each material, try adding 1..available_boxes boxes.

        Uses binary splitting to convert bounded knapsack to 0-1 knapsack
        for efficiency: O(N × A × log(max_boxes)).
        """
        target_units = math.ceil(area_with_waste / cls.GRANULARITY)
        # Cap DP table size to prevent memory issues on huge rooms
        MAX_UNITS = 100_000  # = 1000 m²
        if target_units > MAX_UNITS:
            # Scale granularity for large areas
            effective_gran = area_with_waste / MAX_UNITS
            target_units = MAX_UNITS
        else:
            effective_gran = cls.GRANULARITY

        INF = float("inf")
        # dp[a] = min cost to cover >= a units of area
        dp = [INF] * (target_units + 1)
        dp[0] = 0.0
        # Track which items were used: parent[a] = (material_idx, group_size, prev_a)
        parent: list[tuple[int, int, int] | None] = [None] * (target_units + 1)

        # Binary splitting: split available_boxes into powers of 2
        # Each "item" = (material_index, group_size, area_units, cost)
        items: list[tuple[int, int, int, float]] = []
        for idx, mat in enumerate(materials):
            if mat.available_boxes <= 0:
                continue
            box_area_units = max(1, round(mat.m2_per_box / effective_gran))
            remaining = mat.available_boxes
            k = 1
            while remaining > 0:
                group = min(k, remaining)
                items.append((idx, group, group * box_area_units, group * mat.price_per_box))
                remaining -= group
                k *= 2

        # 0-1 knapsack DP (minimization, covering at least target_units)
        for mat_idx, group_size, area_units, cost in items:
            # Process in reverse to avoid using same item twice
            for a in range(target_units, -1, -1):
                new_a = min(a + area_units, target_units)
                if dp[a] + cost < dp[new_a]:
                    dp[new_a] = dp[a] + cost
                    parent[new_a] = (mat_idx, group_size, a)

        # Also check: covering MORE than target (overshoot) may be cheaper
        # dp[target_units] already represents "cover at least target" since we cap at target
        if dp[target_units] == INF:
            # Fallback: can't cover area with available stock
            # Use as much as possible from cheapest materials
            return cls._solve_greedy_fallback(area_with_waste, effective_gran, materials)

        # Backtrack to find allocation
        allocation_boxes: dict[int, int] = {}
        a = target_units
        while a > 0 and parent[a] is not None:
            mat_idx, group_size, prev_a = parent[a]
            allocation_boxes[mat_idx] = allocation_boxes.get(mat_idx, 0) + group_size
            a = prev_a

        allocations = []
        total_cost = 0.0
        total_m2 = 0.0
        total_boxes = 0
        for idx, boxes in sorted(allocation_boxes.items()):
            mat = materials[idx]
            item_cost = boxes * mat.price_per_box
            item_m2 = boxes * mat.m2_per_box
            allocations.append(AllocationItem(
                material_id=mat.id,
                material_name=mat.name,
                boxes=boxes,
                m2_covered=item_m2,
                cost=item_cost,
                price_per_box=mat.price_per_box,
                m2_per_box=mat.m2_per_box,
            ))
            total_cost += item_cost
            total_m2 += item_m2
            total_boxes += boxes

        return {
            "allocations": allocations,
            "cost": total_cost,
            "m2_covered": total_m2,
            "boxes": total_boxes,
        }

    @staticmethod
    def _solve_greedy_fallback(
        area_with_waste: float,
        granularity: float,
        materials: list[MaterialOption],
    ) -> dict:
        """Greedy fallback when DP can't cover the full area (insufficient total stock)."""
        # Sort by cost per m² ascending
        sorted_mats = sorted(
            [(i, m) for i, m in enumerate(materials) if m.available_boxes > 0],
            key=lambda x: x[1].price_per_box / x[1].m2_per_box,
        )
        remaining_area = area_with_waste
        allocations = []
        total_cost = 0.0
        total_m2 = 0.0
        total_boxes = 0

        for idx, mat in sorted_mats:
            if remaining_area <= 0:
                break
            boxes_needed = math.ceil(remaining_area / mat.m2_per_box)
            boxes_used = min(boxes_needed, mat.available_boxes)
            item_cost = boxes_used * mat.price_per_box
            item_m2 = boxes_used * mat.m2_per_box
            allocations.append(AllocationItem(
                material_id=mat.id,
                material_name=mat.name,
                boxes=boxes_used,
                m2_covered=item_m2,
                cost=item_cost,
                price_per_box=mat.price_per_box,
                m2_per_box=mat.m2_per_box,
            ))
            total_cost += item_cost
            total_m2 += item_m2
            total_boxes += boxes_used
            remaining_area -= item_m2

        return {
            "allocations": allocations,
            "cost": total_cost,
            "m2_covered": total_m2,
            "boxes": total_boxes,
        }
