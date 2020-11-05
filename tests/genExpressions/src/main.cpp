#include <stdio.h>
#include <data.h>
#include <sstream>
#include <string>

using namespace std;

//void foo(){}

void printAST(ostream& os, const ASTNode& tree, bool infix=true){
    stringstream ss;
    if(infix){
        tree.toInfix(ss);
    }else{
        tree.toPrefix(ss);
    }
    os << ss.str().c_str() << endl;
}

void printEqAST(ostream& os, const Equation& tree, bool infix=true){
    stringstream ss;
    if(infix){
        tree.toInfix(ss);
    }else{
        tree.toPrefix(ss);
    }
    os << ss.str().c_str() << endl;
}

int main()
{
    ASTNode a("A");

    vector<ASTNode> leafs{ ASTNode("B"), ASTNode("C"), ASTNode("D") };
    ASTNode b("+", leafs);


    // cout << "INFIX a: ";
    // printAST(cout, a);


    // cout << "PREFIX a: ";
    // printAST(cout, a, false);

    // cout << "INFIX b: ";
    // printAST(cout, b);


    // cout << "PREFIX b: ";
    // printAST(cout, b, false);

    Equation eqA(a);
    Equation eqB(b);
    printEqAST(cout, eqA);
    cout << "SCORE a: "<<eqA.score()<<endl;
    printEqAST(cout, eqB);
    cout << "SCORE b: "<<eqB.score()<<endl;


    // foo();
    // foo(1);
    // foo(1,'A');
    // foo(1,'A',"ABC");
    // printf("ABC\n");
    return 0;
}