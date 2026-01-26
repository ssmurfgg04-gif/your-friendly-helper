import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Eye, ShoppingCart, Target, ArrowUpRight } from "lucide-react";

interface ProductStat {
  product_id: string;
  product_name: string;
  views: number;
  checkout_clicks: number;
  actual_sales: number;
  sales_count: number;
  conversion_rate: number;
}

export function ProductPerformance() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ProductStat[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_performance_stats")
        .select("*")
        .order("actual_sales", { ascending: false });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error("Failed to fetch product stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Product Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((acc, s) => acc + s.views, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total "Close Sales" (Cart Adds)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((acc, s) => acc + s.checkout_clicks, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Average Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.reduce((acc, s) => acc + s.conversion_rate, 0) / (stats.length || 1)).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Performance Breakdown</CardTitle>
          <CardDescription>
            Comparing views, intent (close sales), and actual purchases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Close Sales (Intent)</TableHead>
                <TableHead className="text-right">Actual Sales (Items)</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={stat.product_id}>
                  <TableCell className="font-medium">{stat.product_name}</TableCell>
                  <TableCell className="text-right">{stat.views}</TableCell>
                  <TableCell className="text-right">{stat.checkout_clicks}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={stat.actual_sales > 0 ? "default" : "secondary"}>
                      {stat.actual_sales}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono">{stat.conversion_rate.toFixed(1)}%</span>
                      {stat.conversion_rate > 10 && (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No product data tracked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
